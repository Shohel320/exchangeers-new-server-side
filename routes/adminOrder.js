const express = require('express');
const { getOrders, addOrder, deleteOrder } = require('../controler/adminOrderController')

const router = express.Router();


router.post("/add", addOrder);
router.get("/", getOrders);
router.delete("/delete/:id", deleteOrder);

module.exports = router; 