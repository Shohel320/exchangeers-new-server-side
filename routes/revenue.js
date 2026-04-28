const express = require("express");
const MonthlyReport = require("../models/revenueReport");

const router = express.Router();

/* ===== ADD MONTHLY REPORT ===== */
router.post("/monthly-report", async (req, res) => {
  try {
    const { month, userProfit, expenses } = req.body;

    // 1️⃣ Company profit = 20%
    const companyProfit = userProfit * 0.2;

    // 2️⃣ Calculate total expense
    const totalExpense = Object.values(expenses || {}).reduce(
      (a, b) => a + Number(b || 0),
      0
    );

    // 3️⃣ Final profit
    const finalProfit = companyProfit - totalExpense;

    // 4️⃣ Growth calculation
    const previous = await MonthlyReport.findOne()
      .sort({ createdAt: -1 })
      .limit(1);

    let growthPercent = 0;
    if (previous && previous.companyProfit > 0) {
      growthPercent =
        ((companyProfit - previous.companyProfit) /
          previous.companyProfit) *
        100;
    }

    const report = await MonthlyReport.create({
      month,
      userProfit,
      companyProfit,
      expenses,
      totalExpense,
      finalProfit,
      growthPercent,
    });

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===== GET ALL REPORTS (TABLE VIEW) ===== */
router.get("/monthly-report", async (req, res) => {
  try {
    const reports = await MonthlyReport.find().sort({ month: 1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ===== GET SINGLE MONTH ===== */
router.get("/monthly-report/:month", async (req, res) => {
  try {
    const report = await MonthlyReport.findOne({ month: req.params.month });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
