const express = require('express');
const Trade = require('../models/Trade');
const axios = require('axios');
const { subscribeToPair } = require('../Services/PriceBridge');
const User = require('../models/user');
const Agent = require('../models/agent')
const AdminCommission = require('../models/AdminCommission');
const TransactionHistory  = require('../models/userTradeHistory')


const router = express.Router();

// ✅ 1. Open Trade (Admin Only)
router.post('/open', async (req, res) => {
  try {
    const { pair, direction, quantity, baseQuantity, leverage } = req.body;

    if (!pair || !direction || !quantity) {
      return res.status(400).json({ message: 'pair, direction, quantity required' });
    }

    // Get live price from Binance REST API
    const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);
    const entryPrice = parseFloat(response.data.price);

    // Create Trade
    const trade = new Trade({
      pair,
      direction,
      leverage,
      quantity,
      entryPrice,
      baseQuantity,
      status: 'OPEN'
    });

    await trade.save();

    // Subscribe to WebSocket for this pair if not already
    subscribeToPair(pair);

    res.json({ message: 'Trade opened successfully', trade });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ 2. Close Trade (Admin Only)
router.post('/close/:id', async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    if (trade.status === 'CLOSED') return res.status(400).json({ message: 'Trade already closed' });

    // Binance থেকে Live Price ফেচ
    const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${trade.pair}`);
    const closePrice = parseFloat(response.data.price);

   // ✅ Profit/Loss হিসাব
let profitLossUsd = 0;
let profitLossPercent = 0;

// Entry & Close Price
const entry = Number(trade.entryPrice);
const close = Number(closePrice);

// Quantity (Base এবং Leverage)
const baseQty = Number(trade.baseQuantity || 0);
const leverage = Number(trade.leverage || 3);
const leveragedQty = baseQty * leverage; // মোট এক্সপোজার

if (entry > 0 && baseQty > 0) {
  let priceDiffRatio = 0;

  if (trade.direction === 'LONG') {
    priceDiffRatio = (close - entry) / entry;
  } else if (trade.direction === 'SHORT') {
    priceDiffRatio = (entry - close) / entry;
  }

  // ✅ Profit/Loss (USDT) লেভারেজড কোয়ান্টিটি অনুযায়ী
  profitLossUsd = priceDiffRatio * leveragedQty;

  // ✅ Profit/Loss (%) বেস কোয়ান্টিটি অনুযায়ী
  profitLossPercent = (profitLossUsd / baseQty) * 100;
}



    // ✅ Trade এ Save করা
    trade.status = 'CLOSED';
    trade.closePrice = closePrice;
    trade.profitLossPercent = profitLossPercent.toFixed(2);
    trade.profitLossUSDT = profitLossUsd.toFixed(2);
    await trade.save();

    // ✅ সব ইউজারের ব্যালেন্স আপডেট + এজেন্ট & এডমিন কমিশন
    // ✅ সব ইউজারের ব্যালেন্স আপডেট + এজেন্ট & এডমিন কমিশন
const users = await User.find().populate("referredBy");

for (let user of users) {
  const walletBefore = user.defaultWalletBalance || 0;
  const change = (walletBefore * profitLossPercent) / 100;

  if (change > 0) {
    // কমিশন হিসাব
    const agentCommission = (change * 5) / 100;
    const adminCommission = (change * 15) / 100;
    const userNetProfit = change - (agentCommission + adminCommission);

    // ✅ ইউজারের ওয়ালেট আপডেট
    user.defaultWalletBalance = walletBefore + userNetProfit;
    await user.save();

    // ✅ একসাথে TransactionHistory এ সব ইনফো সেভ
    await TransactionHistory.create({
      userId: user._id,
      tradeId: trade._id,
      type: "PROFIT",
      amount: userNetProfit,
      agentCommission: agentCommission,
      adminCommission: adminCommission,
      balanceAfter: user.defaultWalletBalance,
      description: `Trade profit: ${userNetProfit.toFixed(2)} | Agent: ${agentCommission.toFixed(2)} | Admin: ${adminCommission.toFixed(2)}`,
    });

    // ✅ এজেন্ট কমিশন আলাদা আপডেট (Agent Table)
    if (user.referredBy) {
      const agent = await Agent.findById(user.referredBy);
      if (agent) {
        agent.commissionBalance = (agent.commissionBalance || 0) + agentCommission;
        await agent.save();
      }
    }

    // ✅ এডমিন কমিশন আলাদা আপডেট (Admin Table)
    let admin = await AdminCommission.findOne();
    if (!admin) {
      admin = new AdminCommission({ totalCommission: 0, history: [] });
    }
    admin.totalCommission += adminCommission;
    admin.history.push({
      amount: adminCommission,
      fromUser: user._id,
      tradeId: trade._id,
    });
    await admin.save();

  } else {
    // 🔻 LOSS
    user.defaultWalletBalance = walletBefore + change;
    await user.save();

    await TransactionHistory.create({
      userId: user._id,
      tradeId: trade._id,
      type: "LOSS",
      amount: change,
      balanceAfter: user.defaultWalletBalance,
      agentCommission: 0,
      adminCommission: 0,
      description: `Trade loss deducted.`,
    });
  }
}

res.json({
  message: 'Trade closed successfully, balances & commissions updated',
  trade,
  profitLossPercent
});

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


// ✅ 3. Get All Trades (User View)
router.get('/', async (req, res) => {
  try {
    const trades = await Trade.find().sort({ createdAt: -1 });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.get("/commission", async (req, res) => {
  try {
    const adminCommission = await AdminCommission.findOne().populate("history.fromUser", "name email");

    if (!adminCommission) {
      return res.json({
        totalCommission: 0,
        history: []
      });
    }

    res.json({
      totalCommission: adminCommission.totalCommission,
      history: adminCommission.history
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
