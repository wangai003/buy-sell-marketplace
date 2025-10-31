const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

// Replace with your actual ngrok URL or server URL
const WEBHOOK_URL = 'https://e1bb12e24e1e.ngrok-free.app/api/webhook'; // Update this

// Sample webhook payload for Helio payment.success event
const samplePayload = {
  event: 'payment.success',
  data: {
    orderId: 'sample-order-id', // Replace with actual order ID
    transactionHash: '0x123456789abcdef',
    token: 'SOL',
    paidAmount: 10.0,
  },
};

// Generate HMAC signature
const secret = process.env.HELIO_WEBHOOK_SECRET;
const payloadString = JSON.stringify(samplePayload);
const signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

console.log('Testing webhook...');
console.log('Payload:', samplePayload);
console.log('Signature:', signature);

axios.post(WEBHOOK_URL, samplePayload, {
  headers: {
    'Content-Type': 'application/json',
    'x-helio-signature': signature,
  },
})
  .then(response => {
    console.log('Webhook test successful:', response.data);
  })
  .catch(error => {
    console.error('Webhook test failed:', error.response ? error.response.data : error.message);
  });