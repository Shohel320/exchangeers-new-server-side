const AdminSTL = require('../models/stopLoss')


 const addStopLoss = async (req, res) => {
  try {
    const stopLoss = await AdminSTL.create(req.body);
    res.status(201).json(stopLoss);
  } catch (err) {
    res.status(500).json({ message: "Failed to save order", error: err.message });
  }
};

// সব pending order দেখা
 const getStopLoss = async (req, res) => {
  try {
    const stopLoss = await AdminSTL.find().sort({ createdAt: -1 });
    res.json(stopLoss);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch StopLoss Info", error: err.message });
  }
};

// order remove করা (trigger হলে)
 const deleteStopLoss = async (req, res) => {
  try {
    await AdminSTL.findByIdAndDelete(req.params.id);
    res.json({ message: "StopLoss Info removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete StopLoss Info", error: err.message });
  }
};

module.exports = {addStopLoss, getStopLoss, deleteStopLoss}