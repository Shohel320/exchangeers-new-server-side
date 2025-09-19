const express = require('express');
const Trade = require('../models/Trade');
const axios = require('axios');
const { subscribeToPair } = require('../Services/PriceBridge');

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

    // Get current market price
    const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${trade.pair}`);
    const closePrice = parseFloat(response.data.price);

    // Calculate final PnL
    let profitLossPercent = 0;
    if (trade.direction === 'LONG') {
      profitLossPercent = ((closePrice - trade.entryPrice) / trade.entryPrice) * 100;
    } else if (trade.direction === 'SHORT') {
      profitLossPercent = ((trade.entryPrice - closePrice) / trade.entryPrice) * 100;
    }

    const profitLossUSDT = (profitLossPercent / 100) * trade.quantity;

    trade.status = 'CLOSED';
    trade.closePrice = closePrice;
    trade.profitLossPercent = profitLossPercent.toFixed(2);
    trade.profitLossUSDT = profitLossUSDT.toFixed(2);

    await trade.save();

    res.json({ message: 'Trade closed successfully', trade });
  } catch (err) {
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

module.exports = router;
