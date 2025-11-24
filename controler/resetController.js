// controllers/authController.js
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const transporter = require('../Utilis/mailer');

const FRONTEND_URL = 'http://localhost:5173';
const RESET_EXPIRE_MIN =  60;

// Request Password Reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // respond generic to avoid revealing account existence
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // generate token (plain for email), hash for DB
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashed;
    user.resetPasswordExpire = Date.now() + RESET_EXPIRE_MIN * 60 * 1000; // 60 mins default
    await user.save();

    // Send email
    const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}&id=${user._id}`;

    const html = `
      <h2>Password reset request</h2>
      <p>Hello ${user.username},</p>
      <p>We received a request to reset your password. Click the button below to reset it. This link will expire in ${RESET_EXPIRE_MIN} minutes.</p>
      <a href="${resetLink}" style="display:inline-block;padding:10px 15px;background:#1a73e8;color:white;border-radius:6px;text-decoration:none;">Reset Password</a>
      <p>If you didn't request this, you can ignore this email.</p>
    `;

    await transporter.sendMail({
      from: "support@exchangeers.com",
      to: user.email,
      subject: 'Reset your password',
      html
    });

    return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('requestPasswordReset error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password (perform)
exports.resetPassword = async (req, res) => {
  try {
    const { token, id, password, confirmPassword } = req.body;
    if (!token || !id || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password do not match' });
    }

    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      _id: id,
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    // optional: notify user of password change
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Your password has been changed',
      html: `<p>Hello ${user.username}, your password was successfully changed. If you did not do this, contact support immediately.</p>`
    });

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('resetPassword error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
