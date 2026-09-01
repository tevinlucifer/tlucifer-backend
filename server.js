import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend assets
app.use(express.static(__dirname));

// In-memory OTP store (stores email -> { otp, expiresAt })
const otpStore = new Map();

// Configure Nodemailer Transporter
// Use environment variables for production security (e.g. Gmail App Password, SendGrid, etc.)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // e.g. "your-email@gmail.com"
    pass: process.env.EMAIL_PASS, // e.g. "your-app-password"
  },
});

// API Endpoint: Send OTP
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    // Store OTP in-memory
    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    // Console logging for local debugging
    console.log(`[OTP DEBUG] Sent to ${email}: ${otp}`);

    // Send Mail via Nodemailer (if credentials are set)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const mailOptions = {
        from: `"TD System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'TD System - Account Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Verification Code</h2>
            <p>Your one-time passkey for registering with TD System is:</p>
            <h1 style="letter-spacing: 5px; color: #111827; background: #f3f4f6; padding: 10px 20px; display: inline-block; border-radius: 8px;">${otp}</h1>
            <p>This code will expire in <strong>5 minutes</strong>.</p>
            <p style="font-size: 12px; color: #888;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    return res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error sending OTP.' });
  }
});

// API Endpoint: Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const normalizedEmail = email.toLowerCase();
    const record = otpStore.get(normalizedEmail);

    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP requested or code expired.' });
    }

    // Check expiration
    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new one.' });
    }

    // Validate OTP matching
    if (record.otp === otp.trim()) {
      otpStore.delete(normalizedEmail); // Clear single-use OTP upon successful verification
      return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
    }

    return res.status(400).json({ success: false, message: 'Invalid OTP code. Please try again.' });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error verifying OTP.' });
  }
});

// Fallback Route for Single Page Application
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server actively listening on port ${PORT}`);
});