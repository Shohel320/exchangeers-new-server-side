const Ticket = require("../models/ticket");
const Message = require("../models/userSupport");

const createTicket = async (req, res) => {
  try {
    const { subject, message } = req.body;

    const ticket = await Ticket.create({
      user: req.user._id,
      subject,
    });

    const msg = await Message.create({
      ticket: ticket._id,
      sender: req.user._id,
      text: message,
      isAdmin: false,
    });

    res.json({ ticket, msg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const replyTicket =  async (req, res) => {
  try {
    const { message } = req.body;

    const msg = await Message.create({
      ticket: req.params.ticketId,
      sender: req.user._id,
      text: message,
      isAdmin: false,
    });

    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 ইউজার নিজের টিকিটগুলো দেখবে
const userAllTicket =  async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const ticketMessage = async (req, res) => {
  try {
    const msgs = await Message.find({ ticket: req.params.ticketId }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const closeTicket =  async (req, res) => {
  try {
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.ticketId, user: req.user._id },
      { status: "closed" },
      { new: true }
    );
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = { createTicket, replyTicket, userAllTicket, ticketMessage, closeTicket};
