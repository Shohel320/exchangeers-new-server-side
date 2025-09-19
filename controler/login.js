// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');



// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 2) Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3) Generate JWT token
    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'change_this_secret', {
      expiresIn: '7d'
    });

    // 4) Send response
    return res.status(200).json({
      message: 'Login successful',
      user: user.toSafeObject(),
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login };
