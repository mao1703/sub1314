const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  // If no SMTP config, log to console (Dev mode)
  if (!process.env.MAIL_HOST) {
    console.log('========================================');
    console.log(`[Mock Email] To: ${to}`);
    console.log(`[Mock Email] Subject: ${subject}`);
    console.log(`[Mock Email] Text: ${text}`);
    console.log('========================================');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || '"Trae Blog" <noreply@example.com>',
    to,
    subject,
    text,
  });
};

module.exports = sendEmail;
