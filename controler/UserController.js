// controllers/userController.js
const User = require('../models/user');
const Deposit = require('../models/Deposit');

exports.createDeposit = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    const deposit = await Deposit.create({ userId: req.user._id, amount });
    return res.status(201).json({ deposit });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.confirmDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const deposit = await Deposit.findById(id);
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    if (deposit.status === 'COMPLETED') return res.status(400).json({ message: 'Already completed' });

    deposit.status = 'COMPLETED';
    await deposit.save();

    const user = await User.findById(deposit.userId);
    user.balance += deposit.amount;
    await user.save();

    res.json({ deposit, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
