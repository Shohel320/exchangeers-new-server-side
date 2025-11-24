const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 50, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  country: { type: String, trim: true, default: '' },
  defaultWalletBalance: { type: Number, default: 0 },
  profitBalance: { type: Number, default: 0 },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", default: null },

  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String, default: null },
  emailVerifyTokenExpire: { type: Date, default: null },

   resetPasswordToken: { type: String, default: null }, // hashed token stored
  resetPasswordExpire: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now }
});

// safe object
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    phone: this.phone,
    country: this.country,
    emailVerified: this.emailVerified,
    defaultWalletBalance: this.defaultWalletBalance,
    profitBalance: this.profitBalance,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
