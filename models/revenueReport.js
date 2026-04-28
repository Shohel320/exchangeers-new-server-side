const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  officeRent: { type: Number, default: 0 },
  salary: { type: Number, default: 0 },
  internet: { type: Number, default: 0 },
  electricity: { type: Number, default: 0 },
  server: { type: Number, default: 0 },
  fbAds: { type: Number, default: 0 },
  googleAds: { type: Number, default: 0 },
  referral: { type: Number, default: 0 },
  software: { type: Number, default: 0 },
  legal: { type: Number, default: 0 },
  maintenance: { type: Number, default: 0 },
  other: { type: Number, default: 0 },
});

const monthlyReportSchema = new mongoose.Schema(
  {
    month: { type: String, required: true, unique: true }, // YYYY-MM-DD
    userProfit: { type: Number, required: true },
    companyProfit: { type: Number, required: true }, // 20%
    expenses: expenseSchema,
    totalExpense: { type: Number, required: true },
    finalProfit: { type: Number, required: true },
    growthPercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MonthlyReport", monthlyReportSchema);
