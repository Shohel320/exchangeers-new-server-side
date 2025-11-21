const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Agent = require("../models/agent");
const cors = require("cors");
const bodyParser = require("body-parser");
const User = require('../models/user')
const WithdrawRequest = require('../models/agentWithdraw')

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Referral code generator
const generateReferralCode = () =>
  "AG" + Math.random().toString(36).substring(2, 8).toUpperCase();

// ===============================
// 🔹 Agent Signup
// ===============================
const agentSignUp = async (req, res) => {
  try {
    const { name, email, password, phone, country } = req.body;

    const existing = await Agent.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Agent already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const agent = new Agent({
      name,
      email,
      password: hashedPassword,
      phone,
      country,
      referralCode: generateReferralCode(),
    });

    await agent.save();

    res.json({
      message: "Agent created successfully",
      referralCode: agent.referralCode,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// 🔹 Agent Login
// ===============================
const agentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const agent = await Agent.findOne({ email });
    if (!agent) return res.status(400).json({ message: "Agent not found" });

    const isMatch = await bcrypt.compare(password, agent.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: agent._id, role: "agent" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// 🔹 Agent Commission (for logged-in agent)
// ===============================
const Commision = async (req, res) => {
  try {
    // 🔹 লগইন করা এজেন্টের প্রোফাইল খুঁজে বের করা
    const agent = await Agent.findById(req.user._id).select(
      "commissionBalance referralCode name email status"
    );

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // 🔹 এই এজেন্টের মাধ্যমে রেফার করা সব ইউজারের তথ্য আনো
    const referredUsers = await User.find({ referredBy: agent._id }).select(
      "username email fundingBalance createdAt"
    );

    // 🔹 কতজন ইউজার রেফার হয়েছে তার সংখ্যা
    const totalReferredUsers = referredUsers.length;

    // 🔹 approved না হলে referralCode null করে দাও
    const referralCode =
      agent.status === "approved" ? agent.referralCode : null;

    // 🔹 রেসপন্স পাঠানো
    res.status(200).json({
      agentName: agent.name,
      agentEmail: agent.email,
      status: agent.status,
      totalCommission: agent.commissionBalance,
      referralCode,
      totalReferredUsers,
      referredUsers, // 🔹 এখানে ইউজারদের লিস্ট পাঠানো হচ্ছে
    });
  } catch (err) {
    console.error("Commission Fetch Error:", err);
    res.status(500).json({ message: "Server Error: " + err.message });
  }
};

// ===============================
// 🔹 Admin: Get all agents (with balance & status)
const getAllAgents = async (req, res) => {
  try {
    // 🔹 সব এজেন্ট বের করা
    const agents = await Agent.find().select(
      "name email phone country commissionBalance status referralCode"
    );

    // 🔹 প্রতিটি এজেন্টের রেফার করা ইউজারের সংখ্যা গণনা করা
    const agentList = await Promise.all(
      agents.map(async (agent) => {
        // ⚠️ User মডেলে referredBy হলো ObjectId, তাই agent._id ব্যবহার করতে হবে
        const referredUsersCount = await User.countDocuments({
          referredBy: agent._id,
        });

        return {
          _id: agent._id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          country: agent.country,
          commissionBalance: agent.commissionBalance,
          status: agent.status,
          referralCode: agent.referralCode,
          totalReferredUsers: referredUsersCount,
        };
      })
    );

    // 🔹 রেসপন্স পাঠানো
    res.status(200).json(agentList);
  } catch (err) {
    console.error("Agent Fetch Error:", err);
    res.status(500).json({ message: "Server Error: " + err.message });
  }
};

// ===============================
// 🔹 Admin: Change agent status
// ===============================
const updateAgentStatus = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { status } = req.body;

    // স্ট্যাটাস valid কিনা তা চেক করা হচ্ছে
    const validStatuses = ["pending", "approved", "suspended", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedAgent = await Agent.findByIdAndUpdate(
      agentId,
      { status },
      { new: true }
    );

    if (!updatedAgent)
      return res.status(404).json({ message: "Agent not found" });

    res.json({
      message: "Agent status updated successfully",
      agent: updatedAgent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getReferredUsersByAgent = async (req, res) => {
  try {
    const { agentId } = req.params;

    // 🔹 এজেন্ট আইডি সঠিক কিনা যাচাই করা
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // 🔹 এই এজেন্ট কতজন ইউজার রেফার করেছে (User Model থেকে খোঁজা)
    const referredUsers = await User.find({ referredBy: agent._id }).select(
      "username email defaultWalletBalance profitBalance createdAt"
    );

    // 🔹 রেসপন্স পাঠানো
    res.status(200).json({
      agentName: agent.name,
      referralCode: agent.referralCode,
      totalReferredUsers: referredUsers.length,
      users: referredUsers,
    });
  } catch (err) {
    console.error("Referred Users Fetch Error:", err);
    res.status(500).json({ message: "Server Error: " + err.message });
  }
};

 const requestWithdraw = async (req, res) => {
  try {
    const agent = req.user; // ✅ এখন req.agent নয়, req.user (middleware থেকে আসবে)
    const { amount, method, accountNumber } = req.body;

    // 🟡 ইনপুট যাচাই
    if (!amount || !method || !accountNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🟡 কমিশন চেক
    if (agent.totalCommission < amount) {
      return res.status(400).json({ message: "Not enough commission balance" });
    }

    // 🟡 ন্যূনতম উইথড্র অ্যামাউন্ট চেক
    if (amount < 10) {
      return res.status(400).json({ message: "Minimum withdraw amount is $10" });
    }

    // 🟢 উইড্র রিকোয়েস্ট তৈরি
    const withdraw = new WithdrawRequest({
      agentId: agent._id,
      amount,
      method,
      accountNumber,
      status: "pending", // default
    });

    await withdraw.save();

    res.json({
      message: "✅ Withdrawal request submitted successfully",
      withdraw,
    });
  } catch (err) {
    console.error("Withdraw request error:", err);
    res.status(500).json({ message: err.message });
  }
};
 const updateWithdrawStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    console.log("✅ Incoming Request:", requestId, status);

    const withdraw = await WithdrawRequest.findById(requestId);
    if (!withdraw) {
      console.log("❌ Withdraw not found!");
      return res.status(404).json({ message: "Withdraw request not found" });
    }

    console.log("📄 Withdraw found:", withdraw);

    if (!["approved", "rejected"].includes(status.toLowerCase())) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (status.toLowerCase() === "approved") {
      const agent = await Agent.findById(withdraw.agentId);
      if (!agent) {
        console.log("❌ Agent not found for withdraw:", withdraw.agentId);
        return res.status(404).json({ message: "Agent not found" });
      }

      console.log("👤 Agent before update:", {
        name: agent.name,
        commissionBalance: agent.commissionBalance,
      });

      const withdrawAmount = Number(withdraw.amount);
      if (isNaN(withdrawAmount)) {
        return res.status(400).json({ message: "Invalid withdraw amount" });
      }

      if (agent.commissionBalance >= withdrawAmount) {
        agent.commissionBalance -= withdrawAmount;
        console.log(`💰 Commission reduced by ${withdrawAmount}`);
      } else {
        console.log(
          `⚠️ Not enough balance (${agent.commissionBalance}). Setting to 0.`
        );
        agent.commissionBalance = 0;
      }

      await agent.save();

      console.log("✅ Agent after update:", {
        name: agent.name,
        commissionBalance: agent.commissionBalance,
      });
    }

    withdraw.status = status.toLowerCase();
    await withdraw.save();

    console.log("✅ Withdraw updated successfully.");

    res.json({
      message: `Withdraw ${status} successfully`,
      withdraw,
    });
  } catch (err) {
    console.error("🔥 Error in updateWithdrawStatus:", err);
    res.status(500).json({ message: err.message });
  }
};


 const getAllWithdrawRequests = async (req, res) => {
  try {
    const requests = await WithdrawRequest.find()
      .populate("agentId", "name email totalCommission")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// routes/agentRoute.js
const withdrawRequestFetch = async (req, res) => {
  try {
    const agentId = req.user.id;
    const withdraws = await WithdrawRequest.find({ agentId: agentId }).sort({ createdAt: -1 });
    res.json(withdraws);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch withdraw history" });
  }
};




module.exports = {
  agentSignUp,
  agentLogin,
  Commision,
  getAllAgents,
  updateAgentStatus,
  getReferredUsersByAgent,
  requestWithdraw,
  updateWithdrawStatus,
  getAllWithdrawRequests,
  withdrawRequestFetch
};
