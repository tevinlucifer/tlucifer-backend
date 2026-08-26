require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

// In-memory store for OTPs (email -> { otp, expiresAt })
const otpStorage = {};

app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("ERROR SERVING FILE:", err);
      res.status(500).send("Server running, but index.html was not found in this folder.");
    }
  });
});

// Endpoint to send OTP via Brevo REST API
app.post('/api/send-otp', async (req, res) => {
  let { email, otp } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const sanitizedEmail = email.trim().toLowerCase();

  // Generate 6-digit OTP if not provided
  if (!otp) {
    otp = Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Save OTP in memory with a 5-minute expiration time
  otpStorage[sanitizedEmail] = {
    otp: otp.toString().trim(),
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  };

  const apiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;

  if (!apiKey) {
    console.error("CRITICAL: BREVO_API_KEY environment variable is missing.");
    return res.status(500).json({ 
      success: false, 
      message: 'Server Misconfiguration: BREVO_API_KEY missing in environment variables.' 
    });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: "TLucifer Security", email: "tevingampalage29@gmail.com" },
        to: [{ email: sanitizedEmail }],
        subject: "TLucifer Verification Code",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>TLucifer Security Code</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #2563eb; letter-spacing: 4px;">${otp}</h1>
            <p>This code will expire in 5 minutes. Do not share it with anyone.</p>
          </div>
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API Error Response:', data);
      return res.status(response.status).json({ 
        success: false, 
        message: data.message || 'Failed to dispatch email through Brevo.' 
      });
    }

    console.log(`Email successfully sent to ${sanitizedEmail}:`, data);
    return res.json({ success: true, message: 'OTP sent successfully to email.' });

  } catch (error) {
    console.error('Server Internal Fetch Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint to verify the submitted OTP code
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const sanitizedEmail = email.trim().toLowerCase();
  const record = otpStorage[sanitizedEmail];

  if (!record) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
  }

  // Check expiration
  if (Date.now() > record.expiresAt) {
    delete otpStorage[sanitizedEmail];
    return res.status(400).json({ success: false, message: 'OTP code has expired.' });
  }

  // Validate OTP
  if (record.otp === otp.toString().trim()) {
    delete otpStorage[sanitizedEmail]; // Clear OTP after successful use
    return res.json({ success: true, message: 'OTP verified successfully.' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});