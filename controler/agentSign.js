const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Agent = require("../models/agent");
const cors = require('cors');
const bodyParser = require('body-parser');


const app = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());


// Referral code generate
const generateReferralCode = () =>
  "AG" + Math.random().toString(36).substring(2, 8).toUpperCase();

// Agent Signup
  const agentSignUp =    async (req, res) => {
  try {
    const { name, email, password, phone, country } = req.body;

    const existing = await Agent.findOne({ email });
    if (existing) return res.status(400).json({ message: "Agent already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const agent = new Agent({
      name,
      email,
      password: hashedPassword,
      phone,
      country,
      referralCode: generateReferralCode()
    });

    await agent.save();

    res.json({ message: "Agent created successfully", referralCode: agent.referralCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


    const agentLogin =  async (req, res) => {
  try {
    const { email, password } = req.body;
    const agent = await Agent.findOne({ email });
    if (!agent) return res.status(400).json({ message: "Agent not found" });

    const isMatch = await bcrypt.compare(password, agent.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: agent._id, role: "agent" }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, agent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const Commision =  async (req, res) => {
  try {
    // লগইনকৃত এজেন্ট
    const agent = await Agent.findById(req.user._id).select("commissionBalance referralCode name email");
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // এডমিন কমিশন (যদি থাকে)
    

    res.json({
      totalCommission: agent.commissionBalance,  // এজেন্ট কমিশন
      referralCode: agent.referralCode,
      agentName: agent.name,
      agentEmail: agent.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


   

module.exports = { agentSignUp, agentLogin, Commision };
