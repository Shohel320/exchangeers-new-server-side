const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  country: String,
  referralCode: { type: String, unique: true }, // প্রতিটি এজেন্টের আলাদা কোড
  commissionBalance: { type: Number, default: 0 }, // কমিশন এখানে জমা হবে
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'rejected'], // নির্দিষ্ট মানগুলোর মধ্যে একটি
    default: 'pending', // শুরুতে pending থাকবে
  },
});

module.exports = mongoose.model("Agent", agentSchema);
