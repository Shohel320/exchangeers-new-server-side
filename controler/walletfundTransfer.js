const express = require("express");
const WalletTransferRequest = require("../models/walletTransfer");
const User = require("../models/user");

// Create transfer request
const balanceTransferFund = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.defaultWalletBalance < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    const balancetransfer = new WalletTransferRequest({
      userId: user._id,
      amount,
      status: "pending",
    });

    await balancetransfer.save();
    res.status(201).json({ message: "Transfer request submitted", balancetransfer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin approve or reject
const updateWalletTransferBalance = async (req, res) => {
  try {
    const { status } = req.body;
    const balancetransfer = await WalletTransferRequest.findById(req.params.id);
    if (!balancetransfer) return res.status(404).json({ message: "Transfer not found" });
    if (balancetransfer.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    const user = await User.findById(balancetransfer.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (status === "approved") {
      if (user.defaultWalletBalance >= balancetransfer.amount) {
        user.defaultWalletBalance -= balancetransfer.amount;
        user.profitBalance += balancetransfer.amount;
        balancetransfer.status = "approved";
      } else {
        return res.status(400).json({ message: "Insufficient balance" });
      }
    } else if (status === "rejected") {
      balancetransfer.status = "rejected";
    }

    await Promise.all([user.save(), balancetransfer.save()]);

    res.json({ message: `Transfer ${status}`, balancetransfer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getWalletTransferRequest = async (req, res) => {
  try {
    const requests = await WalletTransferRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const transferWalletAll = async (req, res) => {
  try {
    const requests = await WalletTransferRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Correct export for ES Modules
module.exports = { balanceTransferFund, updateWalletTransferBalance, getWalletTransferRequest, transferWalletAll };
