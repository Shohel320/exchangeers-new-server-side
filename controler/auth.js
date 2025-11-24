// controllers/authController.js
require("dotenv").config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Agent = require('../models/agent')
const nodemailer = require('nodemailer');



const app = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());








  const signup = async (req, res) => {
  try {
    const { username, email, phone, password, confirmPassword, country, referralCode } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and confirmPassword do not match' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: 'Email already in use' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already in use' });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(400).json({ message: 'Phone already in use' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let referredBy = null;
    if (referralCode) {
      const agent = await Agent.findOne({ referralCode });
      if (agent) referredBy = agent._id;
    }

    // Create the user
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

    // ----------- EMAIL VERIFY TOKEN (JWT) ---------------
    const emailVerifyToken = jwt.sign(
      { userId: user._id },
      process.env.EMAIL_SECRET,
      { expiresIn: "1d" }
    );

    user.emailVerifyToken = emailVerifyToken;
    user.emailVerifyTokenExpire = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    // ----------------- SEND VERIFICATION MAIL --------------------
    const transporter = nodemailer.createTransport({
      host: "mail.exchangeers.com",
      port: 465,
      secure: true,
      auth: {
        user: "support@exchangeers.com",
        pass: process.env.MAIL_PASSWORD
      },
      tls: { rejectUnauthorized: false }
    });

    const verifyLink = `http://localhost:5173/verify-email?token=${encodeURIComponent(emailVerifyToken)}`;

    await transporter.sendMail({
      from: "support@exchangeers.com",
      to: email,
      subject: "Verify Your Email",
      html: `
        <h2>Welcome ${username}!</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verifyLink}" style="padding: 10px 15px; background:#28a745; color:white; text-decoration:none;">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
      `
    });

    return res.status(201).json({
      message: 'User created. Verification email sent!',
      user: user.toSafeObject()
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

//router.get("/verify-email", 
  const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send("Invalid link");

    const decoded = jwt.verify(
      token,
      process.env.EMAIL_SECRET
    );

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).send("User not found");

    if (user.emailVerified)
      return res.status(200).send("Email verified successfully!");

    if (user.emailVerifyToken !== token)
      return res.status(400).send("Invalid or expired token");

    // Verify now
    user.emailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyTokenExpire = null;
    await user.save();

    res.send("Email verified successfully!");
  } catch (err) {
    res.status(400).send("Verification failed or link expired");
  }
};






const userProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Server error" });
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

// routes/auth.js
const updateAll = async (req, res) => {
  try {
    const { percentage } = req.body; // e.g. 0.65
    const factor = 1 + percentage / 100; // convert % to multiplier

    await User.updateMany(
      {},
      {
        $mul: {
          defaultWalletBalance: factor,
          profitBalance: factor,
        },
      }
    );

    res.json({ message: "All users updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update all users" });
  }
};

// Search user by username or email
const searchAll =  async (req, res) => {
  try {
    const { query } = req.query; // frontend থেকে ?query=shohel এভাবে আসবে

    if (!query) {
      return res.status(400).json({ message: "Search query required" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } }, // case-insensitive match
        { email: { $regex: query, $options: "i" } }
      ]
    });

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// routes/auth.js (অথবা আপনার ইউজার রাউট ফাইলে)
const allBalance =  async (req, res) => {
  try {
    const result = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$defaultWalletBalance" } } }
    ]);
    const totalBalance = result.length > 0 ? result[0].total : 0;
    res.json({ totalBalance });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch total balance" });
  }
};






module.exports = { signup, verifyEmail, allUser, userProfile, updateBalance, updateNewBalance, updateAll, searchAll, allBalance };
