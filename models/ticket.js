const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  status: { type: String, enum: ["open", "closed"], default: "open" },
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
