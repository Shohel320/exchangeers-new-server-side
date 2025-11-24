const express = require('express')
const router = express.Router();

const { requestPasswordReset, resetPassword } = require('../controler/resetController')

router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);





module.exports = router
