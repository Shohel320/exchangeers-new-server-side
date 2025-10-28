// models/Deposit.js
const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  userNumber: {type: Number, required: true},
  paymentMethod: {type: String, required: true},
  customField: {type: String},
  username: {type: String, required: true},
  email: {type: String, required: true},
  transactionId: {type: String, required: true},
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Deposit", depositSchema);
