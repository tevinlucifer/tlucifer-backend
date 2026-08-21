require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
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

// Endpoint to send OTP via Brevo API
app.post('/api/send-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP are required.' });
  }

  // 1. Sanitize and validate API key existence
  const apiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;

  if (!apiKey) {
    console.error("ERROR: BREVO_API_KEY is missing on backend.");
    return res.status(500).json({ 
      success: false, 
      error: 'Server Error: BREVO_API_KEY is missing on backend.' 
    });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'TLucifer Security', email: 'tevingampalage29@gmail.com' },
        to: [{ email: email }],
        subject: 'TLucifer Verification Code',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>TLucifer Security Code</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #2563eb; letter-spacing: 4px;">${otp}</h1>
            <p>This code will expire shortly. Do not share it with anyone.</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API Error:', errorData);
      throw new Error(errorData.message || 'Failed to send OTP via Brevo');
    }

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