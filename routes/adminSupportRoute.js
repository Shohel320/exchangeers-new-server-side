const express = require("express")
const router = express.Router();
const { AlluserTicket,  ticketMessage, adminReplyMessage } = require('../controler/adminSupport')


router.get('/all-tickets', AlluserTicket);
router.get('/messages/:ticketId',  ticketMessage );

router.post('/reply/:ticketId', adminReplyMessage);
module.exports = router;