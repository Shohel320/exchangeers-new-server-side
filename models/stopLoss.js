const mongoose = require("mongoose");

const stopLossSchema = new mongoose.Schema(
  {
    tradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trade",
      required: true,
    },
    pair: {
      type: String,
      required: true,
    },
    stopPercent: {
      type: Number,
      required: true,
    },
    profitPercent: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminSTL", stopLossSchema);
