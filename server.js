require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("ERROR SERVING FILE:", err);
      res.status(500).send("Server running, but index.html was not found in this folder.");
    }
  });
});

// Endpoint to send OTP via direct Brevo REST API
app.post('/api/send-otp', async (req, res) => {
  let { email, otp } = req.body;

  // Validate email presence
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email address is required.' });
  }

  // Fallback: If the frontend didn't pass an OTP, generate a 6-digit code here
  if (!otp) {
    otp = Math.floor(100000 + Math.random() * 900000).toString();
  }

  const apiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;

  if (!apiKey) {
    console.error("CRITICAL: BREVO_API_KEY environment variable is missing.");
    return res.status(500).json({ 
      success: false, 
      error: 'Server Misconfiguration: BREVO_API_KEY missing in environment variables.' 
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
        sender: { name: "TLucifer Security", email: "tevingampalage29@gmail.com" }, // MUST be verified in Brevo Dashboard
        to: [{ email: email }],
        subject: "TLucifer Verification Code",
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

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API Error Response:', data);
      return res.status(response.status).json({ 
        success: false, 
        error: data.message || 'Failed to dispatch email through Brevo.' 
      });
    }

    console.log('Email successfully sent via Brevo API:', data);
    return res.json({ 
      success: true, 
      message: 'OTP sent successfully to email', 
      otp, // Returns OTP so the client can store/verify if needed
      data 
    });

  } catch (error) {
    console.error('Server Internal Fetch Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});