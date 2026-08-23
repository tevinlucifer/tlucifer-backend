require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const brevo = require('@getbrevo/brevo');

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

// Endpoint to send OTP via Brevo API SDK
app.post('/api/send-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP are required.' });
  }

  const apiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;

  if (!apiKey) {
    console.error("ERROR: BREVO_API_KEY is missing on backend.");
    return res.status(500).json({ 
      success: false, 
      error: 'Server Error: BREVO_API_KEY is missing on backend.' 
    });
  }

  // Initialize Brevo API client (Modern SDK standard)
  const apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

  // Configure transactional email content
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = "TLucifer Verification Code";
  sendSmtpEmail.sender = { name: "TLucifer Security", email: "tevingampalage29@gmail.com" }; // Must be verified in Brevo Dashboard
  sendSmtpEmail.to = [{ email: email }];
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>TLucifer Security Code</h2>
      <p>Your verification code is:</p>
      <h1 style="color: #2563eb; letter-spacing: 4px;">${otp}</h1>
      <p>This code will expire shortly. Do not share it with anyone.</p>
    </div>
  `;

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Brevo Email Sent successfully:', data);
    return res.json({ success: true, message: 'OTP sent successfully to email', emailSent: true });
  } catch (error) {
    // Robust error logging to catch Brevo response details
    const errorMessage = error.response?.body?.message || error.body?.message || error.message;

    console.error('Brevo API Error:', errorMessage);
    return res.status(500).json({ success: false, error: errorMessage });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});