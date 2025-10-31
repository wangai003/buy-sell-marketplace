const express = require('express');
const router = express.Router();

// middlewares
const { requireSignin } = require('../middlewares');

// controllers
const { createPayment, handleWebhook, updateOrderStatus, nowpaymentsIpn, createNowpaymentsInvoice, getNowpaymentsCurrencies } = require('../controllers/payment');

// routes
router.post('/payment/create', requireSignin, createPayment);
router.post('/payment/webhook', handleWebhook); // No auth for webhook, as it's from Helio
router.post('/payment/nowpayments/ipn', nowpaymentsIpn); // No auth for IPN
router.post('/payment/nowpayments/invoice', requireSignin, createNowpaymentsInvoice);
router.post('/payment/stellar', requireSignin, require('../controllers/payment').createStellarPayment);
router.get('/orders/:orderId', requireSignin, require('../controllers/payment').getOrderStatus);
router.get('/payment/nowpayments/currencies', getNowpaymentsCurrencies);
router.put('/payment/status', requireSignin, updateOrderStatus);

module.exports = router;