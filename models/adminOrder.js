const mongoose = require("mongoose");

const AdminOrderSchema = new mongoose.Schema({
  pair: String,
  direction: String,
  quantity: Number,
   baseQuantity: { type: Number, required: true },
  orderType: String,
  limitPrice: Number,
  status: { type: String, default: "PENDING" },
  createdAt: { type: Date, default: Date.now },
  leverage: {
    type: Number,
    default: 3,
  },
});

module.exports =  mongoose.model("AdminOrder", AdminOrderSchema);
