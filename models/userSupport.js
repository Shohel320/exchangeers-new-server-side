const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  text: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
