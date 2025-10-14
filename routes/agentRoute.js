const express = require('express');
const router = express.Router();
const { agentSignUp, agentLogin, Commision } = require("../controler/agentSign");
const  agentMiddleware  = require ('../middleware/agentMiddleware');


router.post('/signup', agentSignUp);
router.post('/login',  agentLogin)
router.get('/commision', agentMiddleware,  Commision)


module.exports = router; 