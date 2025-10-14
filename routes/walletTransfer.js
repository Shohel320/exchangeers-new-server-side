const express = require('express')
const router = express.Router();

const { balanceTransferFund, updateWalletTransferBalance, getWalletTransferRequest, transferWalletAll } = require('../controler/walletfundTransfer')
const  authMiddleware  = require ('../middleware/profileMiddleware');

router.post('/balance/request', authMiddleware, balanceTransferFund);
router.put('/balance/update/:id', updateWalletTransferBalance);
router.get('/balance/get/one', authMiddleware, getWalletTransferRequest);
router.get('/balance/get/requestall', transferWalletAll);



module.exports = router
