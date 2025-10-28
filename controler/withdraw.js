const express = require("express");
const WithdrawWalletTransferRequest = require("../models/withdrawmodel");
const User = require("../models/user");

// Create transfer request
const WithdrawTransferFund = async (req, res) => {
  try {
    const { amount, accountNumber, paymentMethod, notes, username, email, } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profitBalance < amount) {
      return res.status(400).json({ message: "Insufficient funding balance" });
    }

    const Withdrawtransfer = new WithdrawWalletTransferRequest({
      userId: user._id,
      amount,
      accountNumber,
      paymentMethod,
      notes,
      username,
      email,
      status: "pending",
    });

    await Withdrawtransfer.save();
    res.status(201).json({ message: "Transfer request submitted", Withdrawtransfer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin approve or reject
const WithdrawupdateTransferBalance = async (req, res) => {
  try {
    const { status } = req.body;
    const Withdrawtransfer = await WithdrawWalletTransferRequest.findById(req.params.id);
    if (!Withdrawtransfer) return res.status(404).json({ message: "Transfer not found" });
    
    if (Withdrawtransfer.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    const user = await User.findById(Withdrawtransfer.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (status === "approved") {
      if (user.profitBalance >= Withdrawtransfer.amount) {
        // শুধু profitBalance থেকে মাইনাস করবে, defaultWalletBalance এ কিছু যোগ করবে না
        user.profitBalance -= Withdrawtransfer.amount;
        Withdrawtransfer.status = "approved";
      } else {
        return res.status(400).json({ message: "Insufficient balance" });
      }
    } else if (status === "rejected") {
      Withdrawtransfer.status = "rejected";
    }

    await Promise.all([user.save(), Withdrawtransfer.save()]);

    res.json({ message: `Transfer ${status}`, Withdrawtransfer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const WithdrawgetTransferRequest = async (req, res) => {
  try {
    const requests = await WithdrawWalletTransferRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const WithdrawtransferAll = async (req, res) => {
  try {
    const requests = await WithdrawWalletTransferRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Correct export for ES Modules
module.exports = { WithdrawTransferFund, WithdrawupdateTransferBalance, WithdrawgetTransferRequest, WithdrawtransferAll };
