const express = require("express");
const router = express.Router();
const  authMiddleware  = require ('../middleware/profileMiddleware');
const { getUserTradeHistory } = require("../controler/userHistory");

// ✅ নির্দিষ্ট ইউজারের ট্রেড হিস্টরি
router.get("/user/history", authMiddleware, getUserTradeHistory);


module.exports = router;
