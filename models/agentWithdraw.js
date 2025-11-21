// models/WithdrawRequest.js
const mongoose = require("mongoose");

const withdrawRequestSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["bKash", "Nagad", "Bank"], required: true },
  accountNumber: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);
