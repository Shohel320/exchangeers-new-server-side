const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  isActive: { type: Boolean, default: true }, // ✅ show/hide control
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notice", noticeSchema);
