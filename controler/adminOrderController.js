const AdminOrder = require('../models/adminOrder')
 const addOrder = async (req, res) => {
  try {
    const order = await AdminOrder.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to save order", error: err.message });
  }
};

// সব pending order দেখা
 const getOrders = async (req, res) => {
  try {
    const orders = await AdminOrder.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
};

// order remove করা (trigger হলে)
 const deleteOrder = async (req, res) => {
  try {
    await AdminOrder.findByIdAndDelete(req.params.id);
    res.json({ message: "Order removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete order", error: err.message });
  }
};

module.exports = {addOrder, getOrders, deleteOrder}