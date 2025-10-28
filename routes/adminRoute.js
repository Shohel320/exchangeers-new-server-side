const express = require('express');
const router = express.Router();

const { adminSignUp, adminLogin } = require('../controler/admin')

router.post("/signup", adminSignUp);
router.post("/login", adminLogin);

module.exports = router; 