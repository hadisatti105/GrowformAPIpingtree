// Load environment variables
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load config from .env
const {
  LP_CAMPAIGN_ID,
  LP_CAMPAIGN_KEY,
  PING_URL,
  PORT = 3000
} = process.env;

// Show env variables in console for debugging (optional)
console.log('🔧 ENV Loaded:', {
  LP_CAMPAIGN_ID,
  LP_CAMPAIGN_KEY,
  PING_URL
});

// Form submission route
app.post('/submit', async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    email,
    zip,
    state,
    trustedForm,
    jornayaId,
    ipAddress
  } = req.body;

  // Validate required fields
  if (!LP_CAMPAIGN_ID || !LP_CAMPAIGN_KEY || !PING_URL) {
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required (caller_id)' });
  }

  // Prepare payload
  const payload = {
    lp_campaign_id: LP_CAMPAIGN_ID,
    lp_campaign_key: LP_CAMPAIGN_KEY,
    caller_id: phone,
    first_name: firstName || '',
    last_name: lastName || '',
    phone_number: phone,
    email_address: email || '',
    zip_code: zip || '',
    state: state || '',
    trusted_form_cert_id: trustedForm || '',
    jornaya_lead_id: jornayaId || '',
    ip_address: ipAddress || ''
  };

  try {
    const response = await axios.post(PING_URL, new URLSearchParams(payload), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const result = response.data;

    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        payout: result.payout,
        duration: result.duration,
        transferNumber: result.number,
        pingId: result.ping_id
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
        pingId: result.ping_id
      });
    }

  } catch (error) {
    console.error('❌ Error during ping:', error.message);

    if (error.response) {
      console.error('📨 Response Body:', error.response.data);
      return res.status(500).json({
        success: false,
        error: 'Ping request failed',
        details: error.response.data
      });
    } else if (error.request) {
      console.error('📡 No response received:', error.request);
      return res.status(500).json({
        success: false,
        error: 'No response from Leadspedia server'
      });
    } else {
      console.error('⚙️ Other Error:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Unexpected error occurred'
      });
    }
  }
});

// Test route (optional for debugging)
app.get('/test', (req, res) => {
  res.send('Server is working ✅');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
