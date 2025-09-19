// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { signup } = require('../controler/auth');
const { signupValidators, runValidation } = require('../middleware/validation');
const { login } = require('../controler/login')
const  authMiddleware  = require ('../middleware/profileMiddleware');
const { getProfile } = require ("../controler/profile")

router.post('/signup', signupValidators, runValidation, signup);
router.post('/login', login);
router.get("/profile", authMiddleware, getProfile);

module.exports = router;
