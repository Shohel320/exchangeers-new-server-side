

const TransactionHistory  = require('../models/userTradeHistory')
const mongoose = require("mongoose");

 



exports.getUserTradeHistory = async (req, res) => {
  try {
    const userId = req.user._id; // authMiddleware থেকে পাওয়া ইউজার আইডি

    // ✅ history ফেচ
    const history = await TransactionHistory.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate("tradeId", "pair entryPrice closePrice profitLossPercent status")
      .sort({ createdAt: -1 }); // সর্বশেষ ট্রান্সাকশন আগে

    if (!history.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "No transaction history found.",
      });
    }

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching transaction history.",
    });
  }
};