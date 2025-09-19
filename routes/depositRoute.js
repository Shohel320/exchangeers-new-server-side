const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/profileMiddleware");
const Deposit = require("../models/Deposit");
const User = require("../models/user");

// ✅ ইউজার ডিপোজিট রিকোয়েস্ট পাঠাবে
router.post("/request", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    const deposit = await Deposit.create({ user: req.user._id, amount, status: "PENDING" });
    res.status(201).json({ message: "Deposit request created", deposit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ সব pending deposit দেখাবে (role check নেই)
router.get("/pending", authMiddleware, async (req, res) => {
  try {
    const deposits = await Deposit.find({ status: "PENDING" }).populate("user", "name email");
    res.json(deposits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const deposits = await Deposit.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(deposits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ deposit approve (role check নেই)
router.get("/pendingorder", async (req, res) => {
   try {
    const deposits = await Deposit.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(deposits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ 2. Approve / Reject (role check নেই)
router.post("/:action/:id", async (req, res) => {
  try {
    const { action, id } = req.params;
    const deposit = await Deposit.findById(id);
    if (!deposit) return res.status(404).json({ message: "Deposit not found" });

    if (action === "approve") {
      deposit.status = "APPROVED";
      await deposit.save();

      const user = await User.findById(deposit.user);
      user.balance = (user.balance || 0) + deposit.amount;
      await user.save();

      return res.json({ message: "Deposit approved", deposit });
    } else if (action === "reject") {
      deposit.status = "REJECTED";
      await deposit.save();

      return res.json({ message: "Deposit rejected", deposit });
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
