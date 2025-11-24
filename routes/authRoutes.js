// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { signup, allUser, updateBalance, verifyEmail, updateNewBalance, updateAll, searchAll, allBalance } = require('../controler/auth');
const { signupValidators, runValidation } = require('../middleware/validation');
const { login } = require('../controler/login')
const  authMiddleware  = require ('../middleware/profileMiddleware');
const { getProfile } = require ("../controler/profile")
const { userProfile } = require('../controler/auth')
const { kycUpload, uploadMiddleware, kycData, getAllKycRequests, updateKycStatus, } = require('../controler/kycVerification')

router.post('/signup', signupValidators, runValidation, signup);
router.post('/login', login);
router.get("/profile", authMiddleware, getProfile);
router.get("/all",  allUser);
router.put("/update/:id", updateBalance);
router.put("/update-balance", authMiddleware, updateBalance);
router.put("/update-all", updateAll);
router.get("/search", searchAll);
router.get("/all-balances", allBalance);
router.get("/user/profile", authMiddleware, userProfile);
router.post('/kyc/upload', authMiddleware, uploadMiddleware, kycUpload);
router.get("/kyc/data", authMiddleware, kycData);
router.get("/kyc/data/all", getAllKycRequests);
router.put("/kyc/update/:kycId", updateKycStatus);
router.get("/verify-email", verifyEmail);











module.exports = router;
