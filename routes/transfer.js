const express = require('express')
const router = express.Router();

const { transferFund, updateTransferBalance, getTransferRequest, transferAll} = require('../controler/funding')
const  authMiddleware  = require ('../middleware/profileMiddleware');

router.post('/request', authMiddleware, transferFund);
router.put('/update/:id', updateTransferBalance);
router.get('/get/one', authMiddleware, getTransferRequest);
router.get('/get/requestall', transferAll);



module.exports = router
