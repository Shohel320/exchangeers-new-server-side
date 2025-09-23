const express = require('express');
const Trade = require('../models/Trade');
const axios = require('axios');
const { subscribeToPair } = require('../Services/PriceBridge');
const User = require('../models/user');
const Agent = require('../models/agent')
const AdminCommission = require('../models/AdminCommission')


const router = express.Router();

// ✅ 1. Open Trade (Admin Only)
router.post('/open', async (req, res) => {
  try {
    const { pair, direction, quantity } = req.body;

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
      quantity,
      entryPrice,
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

    // ✅ Profit/Loss Percent হিসাব
    let profitLossPercent = 0;
    if (trade.direction === 'LONG') {
      profitLossPercent = ((closePrice - trade.entryPrice) / trade.entryPrice) * 100;
    } else if (trade.direction === 'SHORT') {
      profitLossPercent = ((trade.entryPrice - closePrice) / trade.entryPrice) * 100;
    }

    const profitLossUSDT = (profitLossPercent / 100) * trade.quantity;

    // ✅ Trade এ Save করা
    trade.status = 'CLOSED';
    trade.closePrice = closePrice;
    trade.profitLossPercent = profitLossPercent.toFixed(2);
    trade.profitLossUSDT = profitLossUSDT.toFixed(2);
    await trade.save();

    // ✅ সব ইউজারের ব্যালেন্স আপডেট + এজেন্ট & এডমিন কমিশন
    const users = await User.find().populate("referredBy"); 
    for (let user of users) {
      const walletBefore = user.defaultWalletBalance || 0;

      // মোট পরিবর্তন
      const change = (walletBefore * profitLossPercent) / 100;

      if (change > 0) {
        // কমিশন হিসাব
        const agentCommission = (change * 5) / 100;
        const adminCommission = (change * 15) / 100;
        const userNetProfit = change - (agentCommission + adminCommission);

        // ✅ ইউজারের ওয়ালেট আপডেট (কমিশন বাদ দিয়ে)
        user.defaultWalletBalance = walletBefore + userNetProfit;
        await user.save();

        // ✅ এজেন্ট কমিশন
        if (user.referredBy) {
          const agent = await Agent.findById(user.referredBy);
          if (agent) {
            agent.commissionBalance = (agent.commissionBalance || 0) + agentCommission;
            await agent.save();
          }
        }

        // ✅ এডমিন কমিশন
       let admin = await AdminCommission.findOne();
      if (!admin) {
       admin = new AdminCommission({ totalCommission: 0, history: [] });
       }

         admin.totalCommission += adminCommission;
         admin.history.push({
          amount: adminCommission,
         fromUser: user._id,
         tradeId: trade._id
       });
      await admin.save();
      } else {
        // লস হলে সরাসরি ইউজারের ওয়ালেট থেকে কাটা হবে
        user.defaultWalletBalance = walletBefore + change;
        await user.save();
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
