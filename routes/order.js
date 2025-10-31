const express = require('express');
const router = express.Router();

// middlewares
const { requireSignin } = require('../middlewares');

// controllers
const { getBuyerOrders, getSellerOrders, getOrderStatus } = require('../controllers/order');

// routes
router.get('/orders/buyer/:buyerId', requireSignin, getBuyerOrders);
router.get('/orders/seller/:sellerId', requireSignin, getSellerOrders);
router.get('/orders/:orderId', requireSignin, getOrderStatus);

module.exports = router;