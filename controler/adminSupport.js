const Ticket = require("../models/ticket");
const Message = require("../models/userSupport");


const AlluserTicket =  async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get one user's ticket by userId (Mongo id)
const ticketMessage = async (req, res) => {
  try {
    const msgs = await Message.find({ ticket: req.params.ticketId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




 const adminReplyMessage =  async (req, res) => {
  try {
    const { message } = req.body;

    const msg = await Message.create({
      ticket: req.params.ticketId,
      text: message,
      isAdmin: true,
    });

    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = {AlluserTicket,  ticketMessage, adminReplyMessage }