const express = require('express')
const router = express.Router();

const {WithdrawTransferFund, WithdrawupdateTransferBalance, WithdrawgetTransferRequest, WithdrawtransferAll } = require('../controler/withdraw')
const  authMiddleware  = require ('../middleware/profileMiddleware');

router.post('/withdraw/request', authMiddleware, WithdrawTransferFund);
router.put('/withdraw/update/:id', WithdrawupdateTransferBalance);
router.get('/withdraw/get/one', authMiddleware, WithdrawgetTransferRequest);
router.get('/withdraw/get/requestall', WithdrawtransferAll);



module.exports = router
