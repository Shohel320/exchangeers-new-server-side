const mongoose = require("mongoose");

const adminCommissionSchema = new mongoose.Schema({
  totalCommission: {
    type: Number,
    default: 0,   // সব কমিশনের যোগফল
  },
  history: [
    {
      amount: Number,        // কত কমিশন এসেছে
      fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // কোন ইউজারের প্রফিট থেকে এসেছে
      tradeId: { type: mongoose.Schema.Types.ObjectId, ref: "Trade" }, // কোন ট্রেড থেকে এসেছে
      date: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("AdminCommission", adminCommissionSchema);
