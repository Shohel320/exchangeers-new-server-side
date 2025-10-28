const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  documentType: {
    type: String,
    enum: ["NID", "Passport", "Driving License"],
    default: "NID",
  },
  documentImage: {
    type: String, // ফাইল পাথ বা URL
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: Date,
 
});

module.exports = mongoose.model("Kyc", kycSchema);
