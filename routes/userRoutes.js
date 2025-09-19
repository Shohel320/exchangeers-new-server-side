// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { createDeposit, confirmDeposit } = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/AuthMiddleWare');

router.post('/deposit', authMiddleware, createDeposit);
router.post('/deposit/confirm/:id', authMiddleware, adminMiddleware, confirmDeposit);

module.exports = router;
