const mongoose = require('mongoose');

const WithdrawwalletTransfer = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  accountNumber: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  notes: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WithdrawWalletTransferRequest", WithdrawwalletTransfer);
