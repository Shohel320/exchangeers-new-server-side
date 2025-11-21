const express = require('express');
const router = express.Router();
const {requestWithdraw, withdrawRequestFetch, updateWithdrawStatus, getAllWithdrawRequests, agentSignUp, agentLogin, Commision, getReferredUsersByAgent, getAllAgents, updateAgentStatus } = require("../controler/agentSign");
const  agentMiddleware  = require ('../middleware/agentMiddleware');


router.post('/signup', agentSignUp);
router.post('/login',  agentLogin)
router.get('/commision', agentMiddleware,  Commision)
router.get('/admin/allagent', getAllAgents)
router.get('/admin/agents/referlist/:agentId', getReferredUsersByAgent)
router.put('/admin/update/status/:agentId', updateAgentStatus)
router.post('/withdraw/request', agentMiddleware, requestWithdraw)
router.get('/admin/withdraw/allrequest', getAllWithdrawRequests)
router.put('/admin/update/request', updateWithdrawStatus)
router.get('/withdraw/agents/request', agentMiddleware, withdrawRequestFetch)









module.exports = router; 