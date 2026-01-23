const express = require('express');
const router = express.Router();

// middlewares
const { requireSignin } = require('../middlewares');

// controllers
const {
  createThirdwebPayment,
  createDirectWalletPayment,
  createExternalWalletPayment,
  createSubscriptionExternalWalletPayment,
  handleThirdwebWebhook,
  handleAzixWebhook,
  updateOrderStatus,
  getOrderStatus,
  confirmManualPayment,
  verifyExternalWalletPayment,
  monitorBlockchainPayments
} = require('../controllers/payment');

// routes
router.post('/payment/thirdweb', requireSignin, createThirdwebPayment);
router.post('/payment/direct-wallet', requireSignin, createDirectWalletPayment);
router.post('/payment/external-wallet', requireSignin, createExternalWalletPayment);
router.post('/payment/subscription/external-wallet', requireSignin, createSubscriptionExternalWalletPayment);
router.post('/payment/thirdweb/webhook', handleThirdwebWebhook); // No auth for webhook, as it's from Thirdweb
router.post('/payment/external-wallet/webhook', handleAzixWebhook); // No auth for webhook, as it's from Azix
router.get('/payment/external-wallet/verify/:orderId', requireSignin, verifyExternalWalletPayment);
router.get('/orders/:orderId', requireSignin, getOrderStatus);
router.put('/payment/status', requireSignin, updateOrderStatus);
router.put('/payment/confirm-manual', requireSignin, confirmManualPayment);

module.exports = router;
