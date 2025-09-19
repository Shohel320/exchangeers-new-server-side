const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  pair: { type: String, required: true }, // BTCUSDT, ETHUSDT etc
  direction: { type: String, enum: ['LONG','SHORT'], required: true },
  quantity: { type: Number, required: true }, // USDT amount
  entryPrice: { type: Number, default: null },
  openAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['OPEN','CLOSED'], default: 'OPEN' },
  closePrice: { type: Number, default: null },
  profitLossPercent: { type: Number, default: null },
  profitLossUSDT: { type: Number, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trade', tradeSchema);

