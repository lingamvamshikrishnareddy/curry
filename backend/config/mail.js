const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  // Configure email service
});

module.exports = transporter;