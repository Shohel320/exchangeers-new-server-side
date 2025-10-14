const express = require("express");
const TransferRequest = require("../models/fundingTransfer");
const User = require("../models/user");

// Create transfer request
const transferFund = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profitBalance < amount) {
      return res.status(400).json({ message: "Insufficient funding balance" });
    }

    const transfer = new TransferRequest({
      userId: user._id,
      amount,
      status: "pending",
    });

    await transfer.save();
    res.status(201).json({ message: "Transfer request submitted", transfer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin approve or reject
const updateTransferBalance = async (req, res) => {
  try {
    const { status } = req.body;
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: "Transfer not found" });
    if (transfer.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    const user = await User.findById(transfer.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (status === "approved") {
      if (user.profitBalance >= transfer.amount) {
        user.profitBalance -= transfer.amount;
        user.defaultWalletBalance += transfer.amount;
        transfer.status = "approved";
      } else {
        return res.status(400).json({ message: "Insufficient balance" });
      }
    } else if (status === "rejected") {
      transfer.status = "rejected";
    }

    await Promise.all([user.save(), transfer.save()]);

    res.json({ message: `Transfer ${status}`, transfer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTransferRequest = async (req, res) => {
  try {
    const requests = await TransferRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const transferAll = async (req, res) => {
  try {
    const requests = await TransferRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Correct export for ES Modules
module.exports = { transferFund, updateTransferBalance, getTransferRequest, transferAll };
