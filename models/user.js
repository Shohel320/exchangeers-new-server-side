// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  country: {
    type: String,
    trim: true,
    default: ''
  },
  defaultWalletBalance: {
    // "default wallet balance" requested — keep numeric
    type: Number,
    default: 0
  },
  profitBalance: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Optional: virtuals to return safe user object
userSchema.methods.toSafeObject = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    phone: this.phone,
    country: this.country,
    defaultWalletBalance: this.defaultWalletBalance,
    profitBalance: this.profitBalance,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
