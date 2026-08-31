import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files (index.html, client.js, CSS)
app.use(express.static(__dirname));

// In-memory OTP storage (for production, use Redis or a DB)
const otpStore = new Map();

// API Endpoint: Send OTP
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, otp);

    // TODO: Integrate Nodemailer or SendGrid here to send the OTP email.
    console.log(`[OTP DEBUG] OTP for ${email}: ${otp}`);

    return res.json({ success: true, message: 'OTP sent successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error sending OTP.' });
  }
});

// API Endpoint: Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const storedOtp = otpStore.get(email);

    if (storedOtp && storedOtp === otp) {
      otpStore.delete(email); // Clear after use
      return res.json({ success: true, message: 'OTP verified successfully.' });
    }

    return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error verifying OTP.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});