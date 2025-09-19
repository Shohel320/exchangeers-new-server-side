// controllers/tradeController.js
// controllers/tradeController.js
const Trade = require('../models/Trade');
const { getLatestPrice } = require('../Services/PriceBridge');

exports.openTrade = async (req, res) => {
  try {
    const { pair, direction } = req.body;
    if (!pair || !direction) return res.status(400).json({ message: 'Missing fields' });

    // Binance থেকে লেটেস্ট প্রাইস নিন
    const entryPrice = getLatestPrice(pair);
    if (!entryPrice) return res.status(400).json({ message: 'No live price available for ' + pair });

    const trade = await Trade.create({
      pair,
      direction,
      entryPrice,   // এখানেই সেট হচ্ছে লাইভ প্রাইস
      createdBy: req.user._id
    });

    // সব ইউজারের কাছে ইভেন্ট পাঠান
    const io = req.app.get('io');
    if (io && io.eventNs) io.eventNs.emit('trade:open', { trade });

    res.status(201).json({ trade });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.closeTrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { closePrice, profitLossPercent } = req.body;
    const trade = await Trade.findById(id);
    if (!trade) return res.status(404).json({ message: 'Trade not found' });

    trade.status = 'CLOSED';
    if (closePrice !== undefined) trade.closePrice = closePrice;
    if (profitLossPercent !== undefined) trade.profitLossPercent = profitLossPercent;
    await trade.save();

    const io = req.app.get('io');
    if (io && io.eventNs) io.eventNs.emit('trade:close', { trade });

    res.json({ trade });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listTrades = async (req, res) => {
  try {
    const trades = await Trade.find().sort({ createdAt: -1 }).limit(200);
    res.json({ trades });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
