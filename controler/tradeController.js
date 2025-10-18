// controllers/tradeController.js
// controllers/tradeController.js
const Trade = require('../models/Trade');
const { getLatestPrice } = require('../Services/PriceBridge');

// FILE: tradeController.js (or similar)

// FILE: tradeController.js (The correct structure)

exports.openTrade = async (req, res) => {
  try {
    // ✅ 1. Destructure ALL required fields from the request body
    const { pair, direction, initialMargin, quantity, leverage } = req.body;
    
    // Basic validation check
    if (!pair || !direction || !quantity || !initialMargin) {
      return res.status(400).json({ message: 'Missing required trade details (pair, direction, quantity, or initialMargin).' });
    }

    // 2. Get the latest price
    const entryPrice = getLatestPrice(pair);
    if (!entryPrice) {
      return res.status(400).json({ message: 'No live price available for ' + pair });
    }

    // 3. Create the trade object
    const trade = await Trade.create({
      pair,
      direction,
      entryPrice,
      quantity,
      initialMargin,
      leverage: leverage || 1,
      createdBy: req.user._id,
    });
    
    // 4. Emit the socket event (Must happen BEFORE sending the response)
    // সব ইউজারের কাছে ইভেন্ট পাঠান (Send event to all users)
    const io = req.app.get('io');
    if (io && io.eventNs) {
      io.eventNs.emit('trade:open', { trade });
    }
    
    // 5. Send the SINGLE success response
    // Ensure you send the 'trade' object itself, not wrapped in {trade} twice
    res.status(201).json(trade); // Send the created trade object

  } catch (error) {
    // Log the specific Mongoose error for debugging
    console.error("Error opening trade:", error.message); 
    
    // Send 500 status on server processing error
    res.status(500).json({ message: error.message || 'Server error processing trade.' });
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
