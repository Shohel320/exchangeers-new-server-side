const express = require('express');
const { addStopLoss, getStopLoss, deleteStopLoss } = require('../controler/adminStopLoss')

const router = express.Router();


router.post("/add", addStopLoss);
router.get("/", getStopLoss);
router.delete("/delete/:id", deleteStopLoss);

module.exports = router; 