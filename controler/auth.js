// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Agent = require('../models/agent')


const app = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());





const signup = async (req, res) => {
  try {
    const { username, email, phone, password, confirmPassword, country, referralCode  } = req.body;

    // confirm password check (important)
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and confirmPassword do not match' });
    }

    // check existing account by email/username/phone
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: 'Email already in use' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already in use' });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(400).json({ message: 'Phone already in use' });

    // hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);


    let referredBy = null;
    if (referralCode) {
      const agent = await Agent.findOne({ referralCode });
      if (agent) {
        referredBy = agent._id; // শুধু সম্পর্ক তৈরি হবে
      }
    }

    // create user with default balances 0
    const user = new User({
      username,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      country: country || '',
      defaultWalletBalance: 0,
      profitBalance: 0,
      referredBy
    });

    await user.save();

    // Optionally create JWT token to return
    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'change_this_secret', {
      expiresIn: '7d'
    });

    return res.status(201).json({
      message: 'User created',
      user: user.toSafeObject(),
      token
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


const allUser = async (req, res) => {
  try {
    const users = await User.find(); // সব ইউজার ফেচ হবে
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateBalance = async (req, res) => {
  try {
    const { defaultWalletBalance, profitBalance } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (defaultWalletBalance !== undefined) {
      user.defaultWalletBalance = defaultWalletBalance;
    }
    if (profitBalance !== undefined) {
      user.profitBalance = profitBalance;
    }

    await user.save();
    res.json({ message: "User balance updated", user });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


 const updateNewBalance =  async (req, res) => {
  try {
    const { balance } = req.body; // ফ্রন্টএন্ড থেকে নতুন balance আসবে
    const userId = req.user.id;   // টোকেন থেকে ইউজারের আইডি

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ ডিফল্ট ওয়ালেট ব্যালেন্স আপডেট
    user.defaultWalletBalance = balance;

    // ✅ চাইলে Profit Balance ও আপডেট করতে পারেন
    // user.profitBalance = user.profitBalance + (balance - পুরানোBalance);

    await user.save();

    res.json({
      message: "Balance updated successfully",
      defaultWalletBalance: user.defaultWalletBalance,
      profitBalance: user.profitBalance,
    });
  } catch (err) {
    console.error("Balance update error:", err);
    res.status(500).json({ message: "Server error while updating balance" });
  }
};




module.exports = { signup, allUser, updateBalance, updateNewBalance };
