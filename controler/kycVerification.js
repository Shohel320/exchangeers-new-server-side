const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Kyc = require("../models/kycUpload");
const User = require('../models/user')

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/kyc");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user._id}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });
const uploadMiddleware = upload.single("kycDocument")

// ✅ KYC Upload Route
  const kycUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const newKyc = new Kyc({
      userId: req.user._id,
      documentImage: `/uploads/kyc/${req.file.filename}`,
      status: "Pending",
    });

    await newKyc.save();
    res.json({ success: true, message: "KYC submitted successfully", kyc: newKyc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


const kycData = async (req, res) => {
  try {
    const kyc = await Kyc.findOne({ userId: req.user._id });

    if (!kyc) {
      return res.json({
        success: true,
        message: "No KYC data found",
        kyc: null,
      });
    }

    res.json({
      success: true,
      message: "KYC data fetched successfully",
      kyc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


const getAllKycRequests = async (req, res) => {
  try {
    const kycRequests = await Kyc.find()
      .populate("userId", "username email phone") // ইউজারের নাম, ইমেইল, ফোন সহ দেখাবে
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      message: "All KYC requests fetched successfully",
      total: kycRequests.length,
      kycRequests,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateKycStatus = async (req, res) => {
  try {
    const { kycId } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'Approved', 'Rejected', or 'Pending'.",
      });
    }

    const kyc = await Kyc.findById(kycId);
    if (!kyc) {
      return res.status(404).json({ success: false, message: "KYC record not found" });
    }

    kyc.status = status;
    kyc.reviewedAt = new Date();
    await kyc.save();

    // যদি KYC approve হয়, তাহলে ইউজারের kycStatus আপডেট করা যাক
    if (status === "Approved" || status === "Rejected") {
      await User.findByIdAndUpdate(kyc.userId, { kycStatus: status });
    }

    res.json({
      success: true,
      message: `KYC status updated to '${status}'`,
      kyc,
    });
  } catch (error) {
    console.error("Error updating KYC:", error); // 👉 মূল error দেখাবে
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




module.exports = {kycUpload, uploadMiddleware, kycData, getAllKycRequests, updateKycStatus }
