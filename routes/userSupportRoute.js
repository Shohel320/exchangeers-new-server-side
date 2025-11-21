const express = require("express")
const router = express.Router();
const { createTicket, replyTicket, userAllTicket, ticketMessage, closeTicket } = require('../controler/support')
const authMiddleWare = require('../middleware/profileMiddleware')


router.post('/create/ticket', authMiddleWare, createTicket);
router.post('/reply/:ticketId', authMiddleWare, replyTicket );
router.get('/my-tickets',authMiddleWare, userAllTicket);
router.get('/messages/:ticketId', authMiddleWare, ticketMessage);
router.put('/close/:ticketId', authMiddleWare, closeTicket)


module.exports = router;

