// utils/mailer.js
require("dotenv").config();

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "mail.exchangeers.com",
  port:  465,
  secure: true, // true for 465, false for 587
  auth: {
    user: "support@exchangeers.com",
    pass: process.env.MAIL_PASSWORD
  },
  tls: { rejectUnauthorized: false } // shared hosting fix, ok for dev; for prod remove if you have proper certs
});

module.exports = transporter;
