require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (CSS, JS, images)
app.use(express.static(__dirname));

// Serve index.html
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("ERROR SERVING FILE:", err);
      res.status(500).send("Server running, but index.html was not found in this folder.");
    }
  });
});

// Standard Nodemailer configuration for Gmail
// Explicit SSL configuration to prevent Render outbound blocks
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Uses SSL on port 465
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS
  },
  connectionTimeout: 10000 // Fails quickly if blocked rather than hanging forever
});

// Endpoint to handle sending OTPs
app.post('/api/send-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP are required.' });
  }

  try {
    await transporter.sendMail({
      from: `"TLucifer Security" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'TLucifer Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>TLucifer Security Code</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #2563eb; letter-spacing: 4px;">${otp}</h1>
          <p>This code will expire shortly. Do not share it with anyone.</p>
        </div>
      `
    });

    res.json({ success: true, message: 'OTP sent successfully to email', emailSent: true });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});