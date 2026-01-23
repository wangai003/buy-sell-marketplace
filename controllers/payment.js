const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const { ethers } = require('ethers');
const { getTier, getPrice, SUBSCRIPTION_TIERS } = require('../config/subscriptionTiers');

// Transaction logging function
const logTransaction = (action, details) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    details,
  };
  const logFile = path.join(__dirname, '../logs/transactions.log');
  const logLine = JSON.stringify(logEntry) + '\n';

  fs.appendFile(logFile, logLine, (err) => {
    if (err) {
      console.error('Failed to log transaction:', err);
    }
  });
};

// Helper: convert Mongo ObjectId string to bytes32 (zero-padded)
const toBytes32OrderId = (id) => {
  try {
    return ethers.zeroPadValue('0x' + id.toString(), 32);
  } catch (e) {
    console.error('Failed to convert order id to bytes32', id, e);
    return null;
  }
};

// Token addresses on Polygon
const POLYGON_TOKENS = {
  USDC: process.env.POLYGON_USDC_ADDRESS || '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  USDT: process.env.POLYGON_USDT_ADDRESS || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  AKOFA: process.env.POLYGON_AKOFA_ADDRESS || '0x0000000000000000000000000000000000000000' // Update with actual AKOFA token address
};

// Currency conversion rates (to USD)
const CURRENCY_RATES = {
  USDC: 1,      // 1 USDC = 1 USD
  USDT: 1,      // 1 USDT = 1 USD
  AKOFA: 0.0428 // 1 AKOFA = 0.0428 USD
};

// Helper function to convert price from USD to selected currency
const convertPriceToCurrency = (usdPrice, currency) => {
  const rate = CURRENCY_RATES[currency] || 1;
  return usdPrice / rate;
};

// Helper function to convert price from selected currency to USD
const convertPriceFromCurrency = (currencyPrice, currency) => {
  const rate = CURRENCY_RATES[currency] || 1;
  return currencyPrice * rate;
};

// Polygon RPC configuration
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com/';
const POLYGON_CHAIN_ID = 137;

// Payment router contract configuration
const PAYMENT_CONTRACT_ADDRESS = process.env.PAYMENT_CONTRACT_ADDRESS;
const ALLOWED_PAYMENT_TOKENS = [
  POLYGON_TOKENS.USDC,
  POLYGON_TOKENS.USDT,
  POLYGON_TOKENS.AKOFA,
  ...(process.env.EXTRA_PAYMENT_TOKENS ? process.env.EXTRA_PAYMENT_TOKENS.split(',') : [])
];
const ALLOWED_PAYMENT_TOKENS_LOWER = ALLOWED_PAYMENT_TOKENS.map(t => t.toLowerCase());
const USDC_LOWER = POLYGON_TOKENS.USDC.toLowerCase();
const USDT_LOWER = POLYGON_TOKENS.USDT.toLowerCase();
const AKOFA_LOWER = POLYGON_TOKENS.AKOFA.toLowerCase();

// Seller connections subscription configuration
const SUBSCRIPTION_PRICE_USD = parseFloat(
  process.env.SELLER_CONNECTIONS_SUBSCRIPTION_PRICE || '10'
);
const SUBSCRIPTION_WALLET_ADDRESS =
  process.env.SELLER_CONNECTIONS_SUBSCRIPTION_WALLET_ADDRESS ||
  process.env.SELLER_WALLET_ADDRESS ||
  '0x0000000000000000000000000000000000000000';

// External wallet confirmation (Azix backend)
const AZIX_BACKEND_URL = process.env.AZIX_BACKEND_URL;
const AZIX_STORE_API_KEY = process.env.AZIX_STORE_API_KEY;
const AZIX_WEBHOOK_SECRET = process.env.AZIX_WEBHOOK_SECRET;

const normalizeBaseUrl = (url) => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const computeWebhookSignature = (secret, rawBody) => {
  return `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
};

const verifyWebhookSignature = (req) => {
  if (!AZIX_WEBHOOK_SECRET) return true;
  const header = req.headers['x-webhook-signature'];
  if (!header || !req.rawBody) return false;
  const expected = computeWebhookSignature(AZIX_WEBHOOK_SECRET, req.rawBody);
  const headerBuf = Buffer.from(header);
  const expectedBuf = Buffer.from(expected);
  if (headerBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(headerBuf, expectedBuf);
};

const getNextMonthDate = (fromDate) => {
  const base = new Date(fromDate);
  const year = base.getFullYear();
  const month = base.getMonth();
  const day = base.getDate();
  return new Date(year, month + 1, day, base.getHours(), base.getMinutes(), base.getSeconds());
};

// Helper to reset monthly usage counters if needed
const resetMonthlyUsageIfNeeded = (seller) => {
  const now = new Date();
  
  // Reset connection usage if needed
  if (!seller.monthlyConnectionUsageResetDate || new Date(seller.monthlyConnectionUsageResetDate) <= now) {
    seller.monthlyConnectionUsage = 0;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    seller.monthlyConnectionUsageResetDate = nextMonth;
  }
  
  // Reset advertising days if needed
  if (!seller.monthlyAdvertisingDaysResetDate || new Date(seller.monthlyAdvertisingDaysResetDate) <= now) {
    seller.monthlyAdvertisingDaysUsed = 0;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    seller.monthlyAdvertisingDaysResetDate = nextMonth;
  }
  
  // Reset creative requests if needed
  if (!seller.monthlyCreativeRequestsResetDate || new Date(seller.monthlyCreativeRequestsResetDate) <= now) {
    seller.monthlyCreativeRequestsUsed = 0;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    seller.monthlyCreativeRequestsResetDate = nextMonth;
  }
};

const applySubscriptionPaymentIfNeeded = async (order) => {
  if (!order || order.orderType !== 'subscription' || order.subscriptionApplied) {
    return;
  }

  const seller = await User.findById(order.buyerId);
  if (!seller) {
    return;
  }

  const tier = order.subscriptionTier || 'FREE';
  const billingCycle = order.subscriptionBillingCycle || 'monthly';
  const durationMonths = order.subscriptionDurationMonths || (billingCycle === 'yearly' ? 12 : 1);

  const now = new Date();
  const currentActiveUntil = seller.subscriptionActiveUntil || seller.connectionsSubscriptionActiveUntil;
  const baseDate = currentActiveUntil && new Date(currentActiveUntil) > now
    ? currentActiveUntil
    : now;

  // Calculate new expiry date based on duration
  const newActiveUntil = new Date(baseDate);
  newActiveUntil.setMonth(newActiveUntil.getMonth() + durationMonths);

  // Update seller subscription
  seller.subscriptionTier = tier;
  seller.subscriptionBillingCycle = billingCycle;
  seller.subscriptionActiveUntil = newActiveUntil;
  // Keep legacy field for backward compatibility
  seller.connectionsSubscriptionActiveUntil = newActiveUntil;

  // Reset monthly usage counters if needed
  resetMonthlyUsageIfNeeded(seller);

  await seller.save();

  order.subscriptionApplied = true;
  await order.save();

  logTransaction('SUBSCRIPTION_APPLIED', {
    orderId: order._id,
    sellerId: seller._id,
    tier,
    billingCycle,
    durationMonths,
    activeUntil: newActiveUntil,
  });
};

const updateOrderFromAzixPayment = async (order, payment) => {
  if (!order || !payment) return;

  order.status = 'PENDING';
  order.statusHistory.push({ status: 'PENDING', changedAt: new Date() });
  order.paidAmount = payment.amount;
  order.transactionHash = payment.transactionHash;
  order.payAsset = payment.assetCode;
  order.payAddress = payment.recipientAddress;

  await order.save();

  logTransaction('AZIX_PAYMENT_CONFIRMED', {
    orderId: order._id,
    transactionHash: payment.transactionHash,
    amount: payment.amount,
    assetCode: payment.assetCode,
    recipientAddress: payment.recipientAddress,
    senderAddress: payment.senderAddress,
  });

  const app = require('../app');
  const io = app.get('io');
  if (io) {
    io.emit('orderStatusChanged', { orderId: order._id, status: 'PENDING' });
  }

  await applySubscriptionPaymentIfNeeded(order);
};

// Minimal ABI for PaymentReceived event
const PAYMENT_ROUTER_ABI = [
  'event PaymentReceived(bytes32 indexed orderId, address indexed payer, address indexed seller, address token, uint256 amount)'
];

// Initialize Polygon provider and contract instance
let polygonProvider;
let paymentRouter;
try {
  polygonProvider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
  if (PAYMENT_CONTRACT_ADDRESS) {
    paymentRouter = new ethers.Contract(PAYMENT_CONTRACT_ADDRESS, PAYMENT_ROUTER_ABI, polygonProvider);
  }
} catch (error) {
  console.error('Failed to initialize Polygon provider or payment router:', error);
}

// Create order for direct wallet payment (no gateway)
exports.createDirectWalletPayment = async (req, res) => {
  try {
    const { productId, buyerId, sellerId, quantity = 1, currency = 'USDC' } = req.body;

    if (!PAYMENT_CONTRACT_ADDRESS) {
      return res.status(500).json({ error: 'Payment contract not configured' });
    }

    // ✅ SECURITY CHECK 1: Validate authenticated user
    if (req.user && req.user._id.toString() !== buyerId) {
      return res.status(403).json({ error: 'Unauthorized: You can only create payments for yourself' });
    }

    // ✅ SECURITY CHECK 2: Rate limiting - prevent spam payment creation
    const recentOrders = await Order.find({
      buyerId,
      createdAt: { $gte: new Date(Date.now() - 60000) } // Last minute
    });
    if (recentOrders.length >= 3) {
      return res.status(429).json({ error: 'Too many payment requests. Please wait before trying again.' });
    }

    const product = await Product.findById(productId);
    const buyer = await User.findById(buyerId);
    const seller = await User.findById(sellerId);

    if (!product || !buyer || !seller) {
      return res.status(404).json({ error: 'Product, buyer, or seller not found' });
    }

    // Validate required fields
    if (!product.name || !buyer.name || !seller.name) {
      return res.status(400).json({ error: 'Product, buyer, or seller missing required fields' });
    }

    // Validate quantity
    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    // Validate currency - only USDC and USDT are supported
    const selectedCurrency = currency.toUpperCase();
    if (!POLYGON_TOKENS[selectedCurrency]) {
      return res.status(400).json({ error: 'Only USDC, USDT, and AKOFA on Polygon are supported' });
    }

    // ✅ SECURITY CHECK 3: If auction product, validate order exists and user is winner
    if (product.isAuction) {
      const auctionOrder = await Order.findOne({
        productId: product._id,
        buyerId: buyerId,
        status: 'AWAITING_PAYMENT',
        orderType: 'auction'
      });

      if (!auctionOrder) {
        return res.status(403).json({
          error: 'Unauthorized: Only the auction winner can pay for this item. No order found for this auction.'
        });
      }

      // ✅ SECURITY CHECK 4: Validate order belongs to authenticated user
      if (req.user && auctionOrder.buyerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error: 'Unauthorized: You are not the winner of this auction'
        });
      }

      // ✅ SECURITY CHECK 5: Validate order status
      if (auctionOrder.status !== 'AWAITING_PAYMENT') {
        return res.status(400).json({
          error: `This order cannot be paid. Current status: ${auctionOrder.status}`
        });
      }

      // Return existing auction order details for payment
      return res.json({
        orderId: auctionOrder._id,
        orderIdBytes32: toBytes32OrderId(auctionOrder._id),
        amount: auctionOrder.displayPrice.toString(),
        seller: seller.wallet || process.env.SELLER_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
        name: product.name,
        description: `Order #${auctionOrder._id} - ${product.name}`,
        image: product.images?.[0] || '',
        token: POLYGON_TOKENS[selectedCurrency],
        currency: selectedCurrency,
        orderType: 'auction',
        paymentContract: PAYMENT_CONTRACT_ADDRESS,
        allowedTokens: ALLOWED_PAYMENT_TOKENS,
        chainId: POLYGON_CHAIN_ID
      });
    }

    // ✅ SECURITY CHECK 6: Prevent duplicate regular orders
    const existingOrder = await Order.findOne({
      productId,
      buyerId,
      status: { $in: ['AWAITING_PAYMENT', 'PENDING', 'DELIVERING', 'COMPLETED'] },
      orderType: 'regular'
    });

    if (existingOrder) {
      return res.status(409).json({
        error: 'You already have an active order for this product. Please complete or cancel it first.'
      });
    }

    // Regular product payment flow (non-auction)
    // Product price is stored in USD, convert to selected currency for display
    const usdPrice = product.price * quantity;
    const displayPrice = convertPriceToCurrency(usdPrice, selectedCurrency);
    const usdcPrice = usdPrice; // Always store USD equivalent for payment processing

    // Create order
    const order = new Order({
      productId,
      productName: product.name,
      price: usdcPrice,
      quantity,
      buyerId,
      buyerName: buyer.name,
      sellerId,
      sellerName: seller.name,
      sellerWallet: seller.wallet || process.env.SELLER_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
      status: 'AWAITING_PAYMENT',
      receivedAmount: 0,
      displayCurrency: selectedCurrency,
      displayPrice,
      usdcPrice,
      orderType: 'regular'
    });
    await order.save();

    // Log transaction
    logTransaction('DIRECT_WALLET_PAYMENT_CREATED', {
      orderId: order._id,
      productId,
      buyerId,
      sellerId,
      amount: displayPrice,
      currency: selectedCurrency,
    });

    res.json({
      orderId: order._id,
      orderIdBytes32: toBytes32OrderId(order._id),
      amount: displayPrice.toString(),
      seller: seller.wallet || process.env.SELLER_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
      name: product.name,
      description: `Order #${order._id} - ${product.name}`,
      image: product.images?.[0] || '',
      token: POLYGON_TOKENS[selectedCurrency],
      currency: selectedCurrency,
      orderType: 'regular',
      paymentContract: PAYMENT_CONTRACT_ADDRESS,
      allowedTokens: ALLOWED_PAYMENT_TOKENS,
      chainId: POLYGON_CHAIN_ID
    });
  } catch (error) {
    console.error('Error creating direct wallet payment:', error);
    res.status(500).json({ error: 'Failed to create payment', detail: error.message });
  }
};

// Create order for Thirdweb payment
exports.createThirdwebPayment = async (req, res) => {
  try {
    const { productId, buyerId, sellerId, quantity = 1, currency = 'USDC' } = req.body;
    
    // ✅ SECURITY CHECK 1: Validate authenticated user
    if (req.user && req.user._id.toString() !== buyerId) {
      return res.status(403).json({ error: 'Unauthorized: You can only create payments for yourself' });
    }

    const product = await Product.findById(productId);
    const buyer = await User.findById(buyerId);
    const seller = await User.findById(sellerId);
    
    if (!product || !buyer || !seller) {
      return res.status(404).json({ error: 'Product, buyer, or seller not found' });
    }

    // Validate required fields
    if (!product.name || !buyer.name || !seller.name) {
      return res.status(400).json({ error: 'Product, buyer, or seller missing required fields' });
    }

    // Validate quantity
    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    // Validate currency - only USDC and USDT are supported
    const selectedCurrency = currency.toUpperCase();
    if (!POLYGON_TOKENS[selectedCurrency]) {
      return res.status(400).json({ error: 'Only USDC, USDT, and AKOFA on Polygon are supported' });
    }

    // ✅ SECURITY CHECK 2: If auction product, validate order exists and user is winner
    if (product.isAuction) {
      const auctionOrder = await Order.findOne({
        productId: product._id,
        buyerId: buyerId,
        status: 'AWAITING_PAYMENT',
        orderType: 'auction'
      });

      if (!auctionOrder) {
        return res.status(403).json({ 
          error: 'Unauthorized: Only the auction winner can pay for this item. No order found for this auction.' 
        });
      }

      // ✅ SECURITY CHECK 3: Validate order belongs to authenticated user
      if (req.user && auctionOrder.buyerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Unauthorized: You are not the winner of this auction' 
        });
      }

      // ✅ SECURITY CHECK 4: Validate order status
      if (auctionOrder.status !== 'AWAITING_PAYMENT') {
        return res.status(400).json({ 
          error: `This order cannot be paid. Current status: ${auctionOrder.status}` 
        });
      }

      // Return existing auction order details for payment
      return res.json({
        orderId: auctionOrder._id,
        amount: auctionOrder.displayPrice.toString(),
        seller: seller.wallet || process.env.SELLER_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
        name: product.name,
        description: `Order #${auctionOrder._id} - ${product.name}`,
        image: product.images?.[0] || '',
        token: POLYGON_TOKENS[selectedCurrency],
        currency: selectedCurrency,
        purchaseData: {
          productId: product._id.toString(),
          customerId: buyer._id.toString(),
          orderId: auctionOrder._id.toString(),
          orderType: 'auction'
        },
        orderType: 'auction'
      });
    }

    // Regular product payment flow (non-auction)
    // Calculate total price in USD (for Thirdweb, we'll use USD)
    // Product price is stored in USD, convert to selected currency for display
    const usdPrice = product.price * quantity;
    const displayPrice = convertPriceToCurrency(usdPrice, selectedCurrency);
    const usdcPrice = usdPrice; // Always store USD equivalent for payment processing

    // Create order
    const order = new Order({
      productId,
      productName: product.name,
      price: usdcPrice,
      quantity,
      buyerId,
      buyerName: buyer.name,
      sellerId,
      sellerName: seller.name,
      sellerWallet: seller.wallet || process.env.SELLER_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
      status: 'AWAITING_PAYMENT',
      receivedAmount: 0,
      displayCurrency: selectedCurrency,
      displayPrice,
      usdcPrice,
      orderType: 'regular'
    });
    await order.save();

    // Log transaction
    logTransaction('THIRDWEB_PAYMENT_CREATED', {
      orderId: order._id,
      productId,
      buyerId,
      sellerId,
      amount: displayPrice,
      currency: selectedCurrency,
    });

    res.json({
      orderId: order._id,
      amount: displayPrice.toString(),
      seller: seller.wallet || process.env.SELLER_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
      name: product.name,
      description: `Order #${order._id} - ${product.name}`,
      image: product.images?.[0] || '',
      token: POLYGON_TOKENS[selectedCurrency],
      currency: selectedCurrency,
      purchaseData: {
        productId: product._id.toString(),
        customerId: buyer._id.toString(),
        orderId: order._id.toString(),
        orderType: 'regular'
      }
    });
  } catch (error) {
    console.error('Error creating Thirdweb payment:', error);
    res.status(500).json({ error: 'Failed to create payment', detail: error.message });
  }
};

// Create order for external wallet payment (Azix confirmation only)
exports.createExternalWalletPayment = async (req, res) => {
  try {
    const { productId, buyerId, sellerId, quantity = 1, currency = 'USDC' } = req.body;

    // ✅ SECURITY CHECK 1: Validate authenticated user
    if (req.user && req.user._id.toString() !== buyerId) {
      return res.status(403).json({ error: 'Unauthorized: You can only create payments for yourself' });
    }

    const product = await Product.findById(productId);
    const buyer = await User.findById(buyerId);
    const seller = await User.findById(sellerId);

    if (!product || !buyer || !seller) {
      return res.status(404).json({ error: 'Product, buyer, or seller not found' });
    }

    // Validate required fields
    if (!product.name || !buyer.name || !seller.name) {
      return res.status(400).json({ error: 'Product, buyer, or seller missing required fields' });
    }

    // Validate quantity
    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    // Validate currency - only USDC and USDT are supported
    const selectedCurrency = currency.toUpperCase();
    if (!POLYGON_TOKENS[selectedCurrency]) {
      return res.status(400).json({ error: 'Only USDC, USDT, and AKOFA on Polygon are supported' });
    }

    // ✅ SECURITY CHECK 2: If auction product, validate order exists and user is winner
    if (product.isAuction) {
      const auctionOrder = await Order.findOne({
        productId: product._id,
        buyerId: buyerId,
        status: 'AWAITING_PAYMENT',
        orderType: 'auction'
      });

      if (!auctionOrder) {
        return res.status(403).json({
          error: 'Unauthorized: Only the auction winner can pay for this item. No order found for this auction.'
        });
      }

      // ✅ SECURITY CHECK 3: Validate order belongs to authenticated user
      if (req.user && auctionOrder.buyerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error: 'Unauthorized: You are not the winner of this auction'
        });
      }

      // ✅ SECURITY CHECK 4: Validate order status
      if (auctionOrder.status !== 'AWAITING_PAYMENT') {
        return res.status(400).json({
          error: `This order cannot be paid. Current status: ${auctionOrder.status}`
        });
      }

      return res.json({
        orderId: auctionOrder._id,
        amount: auctionOrder.displayPrice.toString(),
        assetCode: selectedCurrency,
        name: product.name,
        description: `Order #${auctionOrder._id} - ${product.name}`,
        image: product.images?.[0] || '',
        orderType: 'auction',
        paymentProvider: 'azix'
      });
    }

    // ✅ SECURITY CHECK 5: Prevent duplicate regular orders
    const existingOrder = await Order.findOne({
      productId,
      buyerId,
      status: { $in: ['AWAITING_PAYMENT', 'PENDING', 'DELIVERING', 'COMPLETED'] },
      orderType: 'regular'
    });

    if (existingOrder) {
      return res.status(409).json({
        error: 'You already have an active order for this product. Please complete or cancel it first.'
      });
    }

    // Product price is stored in USD, convert to selected currency for display
    const usdPrice = product.price * quantity;
    const displayPrice = convertPriceToCurrency(usdPrice, selectedCurrency);
    const usdcPrice = usdPrice; // Always store USD equivalent for payment processing

    const order = new Order({
      productId,
      productName: product.name,
      price: usdcPrice,
      quantity,
      buyerId,
      buyerName: buyer.name,
      sellerId,
      sellerName: seller.name,
      sellerWallet: seller.wallet || process.env.SELLER_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
      status: 'AWAITING_PAYMENT',
      receivedAmount: 0,
      displayCurrency: selectedCurrency,
      displayPrice,
      usdcPrice,
      orderType: 'regular'
    });
    await order.save();

    logTransaction('AZIX_PAYMENT_ORDER_CREATED', {
      orderId: order._id,
      productId,
      buyerId,
      sellerId,
      amount: displayPrice,
      currency: selectedCurrency,
    });

    res.json({
      orderId: order._id,
      amount: displayPrice.toString(),
      assetCode: selectedCurrency,
      name: product.name,
      description: `Order #${order._id} - ${product.name}`,
      image: product.images?.[0] || '',
      orderType: 'regular',
      paymentProvider: 'azix'
    });
  } catch (error) {
    console.error('Error creating external wallet payment:', error);
    res.status(500).json({ error: 'Failed to create payment', detail: error.message });
  }
};

// Create order for seller connections subscription (external wallet)
exports.createSubscriptionExternalWalletPayment = async (req, res) => {
  try {
    const { sellerId, tier = 'STARTER', billingCycle = 'monthly', currency = 'USDC' } = req.body;

    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ error: 'Invalid seller ID' });
    }

    if (req.user && req.user._id.toString() !== sellerId) {
      return res.status(403).json({ error: 'Unauthorized: You can only subscribe for yourself' });
    }

    // Validate tier
    if (!['FREE', 'STARTER', 'BUSINESS', 'CUSTOM'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    if (tier === 'FREE') {
      return res.status(400).json({ error: 'Free tier does not require payment' });
    }

    if (tier === 'CUSTOM') {
      return res.status(400).json({ error: 'Custom tier requires contact with sales team' });
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle. Must be monthly or yearly' });
    }

    const seller = await User.findById(sellerId);
    if (!seller || !seller.canSell) {
      return res.status(404).json({ error: 'Seller not found or not authorized to sell' });
    }

    // Validate and set currency
    const selectedCurrency = currency?.toUpperCase() || 'USDC';
    if (!POLYGON_TOKENS[selectedCurrency]) {
      return res.status(400).json({ error: 'Invalid currency. Only USDC, USDT, and AKOFA are supported' });
    }
    const tierConfig = getTier(tier);
    const usdPrice = getPrice(tier, billingCycle);

    if (usdPrice === null || usdPrice === undefined) {
      return res.status(400).json({ error: 'Invalid pricing for selected tier' });
    }

    // Convert subscription price from USD to selected currency
    const displayPrice = convertPriceToCurrency(usdPrice, selectedCurrency);
    const usdcPrice = usdPrice; // Always store USD equivalent for payment processing
    const subscriptionDurationMonths = billingCycle === 'yearly' ? 12 : 1;

    const order = new Order({
      productId: null,
      productName: `${tierConfig.displayName} Subscription (${billingCycle})`,
      price: usdcPrice,
      quantity: 1,
      buyerId: seller._id,
      buyerName: seller.name,
      sellerId: seller._id,
      sellerName: seller.name,
      sellerWallet: SUBSCRIPTION_WALLET_ADDRESS,
      status: 'AWAITING_PAYMENT',
      receivedAmount: 0,
      displayCurrency: selectedCurrency,
      displayPrice,
      usdcPrice,
      orderType: 'subscription',
      subscriptionTier: tier,
      subscriptionBillingCycle: billingCycle,
      subscriptionDurationMonths,
    });
    await order.save();

    logTransaction('SUBSCRIPTION_PAYMENT_ORDER_CREATED', {
      orderId: order._id,
      sellerId,
      tier,
      billingCycle,
      amount: displayPrice,
      currency: selectedCurrency,
      durationMonths: subscriptionDurationMonths,
    });

    // Return same format as createExternalWalletPayment (Azix flow)
    res.json({
      orderId: order._id,
      amount: displayPrice.toString(),
      assetCode: selectedCurrency,
      name: `${tierConfig.displayName} Subscription`,
      description: `${tierConfig.displayName} subscription (${billingCycle}) for ${seller.name}`,
      image: '',
      orderType: 'subscription',
      paymentProvider: 'azix',
      tier,
      billingCycle,
      durationMonths: subscriptionDurationMonths,
    });
  } catch (error) {
    console.error('Error creating subscription payment:', error);
    res.status(500).json({ error: 'Failed to create subscription payment', detail: error.message });
  }
};

// Verify payment for external wallet flow via Azix backend
exports.verifyExternalWalletPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!AZIX_BACKEND_URL || !AZIX_STORE_API_KEY) {
      return res.status(500).json({ error: 'Azix backend not configured' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (req.user && order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized: You can only verify your own orders' });
    }

    const baseUrl = normalizeBaseUrl(AZIX_BACKEND_URL);
    const response = await axios.get(`${baseUrl}/api/store-payment/verify/${orderId}`, {
      headers: {
        'X-API-Key': AZIX_STORE_API_KEY
      }
    });

    const verification = response.data;
    if (verification?.verified && verification?.payment) {
      const paid = parseFloat(verification.payment.amount);
      // Azix returns amount in selected currency, convert to USD for comparison
      const paidCurrency = order.displayCurrency || 'USDC';
      const paidInUSD = convertPriceFromCurrency(paid, paidCurrency);
      const expected = parseFloat(order.usdcPrice || order.displayPrice);
      if (Math.abs(paidInUSD - expected) > 0.01) {
        return res.status(400).json({ error: 'Payment amount mismatch', verified: false });
      }

      await updateOrderFromAzixPayment(order, verification.payment);
    }

    res.json({
      success: true,
      verified: Boolean(verification?.verified),
      orderId,
      payment: verification?.payment || null
    });
  } catch (error) {
    console.error('Error verifying external wallet payment:', error);
    res.status(500).json({ error: 'Failed to verify payment', detail: error.message });
  }
};

// Webhook handler for Azix payment confirmations
exports.handleAzixWebhook = async (req, res) => {
  try {
    if (!verifyWebhookSignature(req)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const { event, data } = req.body || {};
    if (event !== 'payment.completed') {
      return res.status(200).json({ message: 'Event not handled' });
    }

    const orderId = data?.orderId;
    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'PENDING' || order.status === 'PAID') {
      return res.status(200).json({ message: 'Order already processed' });
    }

    if (data?.amount) {
      const paid = parseFloat(data.amount);
      // Azix returns amount in selected currency, convert to USD for comparison
      const paidCurrency = order.displayCurrency || 'USDC';
      const paidInUSD = convertPriceFromCurrency(paid, paidCurrency);
      const expected = parseFloat(order.usdcPrice || order.displayPrice);
      if (Math.abs(paidInUSD - expected) > 0.01) {
        return res.status(400).json({ error: 'Payment amount mismatch' });
      }
    }

    await updateOrderFromAzixPayment(order, data);

    res.status(200).json({ message: 'Order status updated to PENDING' });
  } catch (error) {
    console.error('Error handling Azix webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
};

// Get order status
exports.getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ status: order.status, order });
  } catch (e) {
    res.status(500).json({ error: 'status error', detail: e.message });
  }
};

// Thirdweb webhook handler for payment confirmations
exports.handleThirdwebWebhook = async (req, res) => {
  try {
    // TODO: Add webhook signature verification when Thirdweb provides it
    const { event, data } = req.body;

    if (event === 'payment.success' || event === 'checkout.completed') {
      const { orderId, transactionHash, amount } = data;

      if (!orderId) {
        return res.status(400).json({ error: 'Missing orderId' });
      }

      // Find order by orderId from purchaseData
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status === 'PAID' || order.status === 'PENDING') {
        return res.status(200).json({ message: 'Order already processed' });
      }

      // Update order status
      order.status = 'PENDING';
      order.statusHistory.push({ status: 'PENDING', changedAt: new Date() });
      if (amount) order.paidAmount = parseFloat(amount);
      if (transactionHash) order.transactionHash = transactionHash;
      await order.save();
      await applySubscriptionPaymentIfNeeded(order);

      // Log transaction
      logTransaction('THIRDWEB_PAYMENT_SUCCESS', {
        orderId,
        transactionHash,
        amount,
      });

      // Emit real-time update
      const app = require('../app');
      const io = app.get('io');
      if (io) {
        io.emit('orderStatusChanged', { orderId: order._id, status: 'PENDING' });
      }

      res.status(200).json({ message: 'Order status updated to PENDING' });
    } else {
      res.status(200).json({ message: 'Event not handled' });
    }
  } catch (error) {
    console.error('Error handling Thirdweb webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
};

// Monitor blockchain transactions for payments
exports.monitorBlockchainPayments = async () => {
  if (!polygonProvider || !paymentRouter || !PAYMENT_CONTRACT_ADDRESS) {
    console.error('Payment monitoring not initialized (provider or contract missing)');
    return;
  }

  try {
    // Get all orders awaiting payment
    const awaitingOrders = await Order.find({
      status: 'AWAITING_PAYMENT',
      sellerWallet: { $exists: true, $ne: null }
    });

    if (awaitingOrders.length === 0) {
      return;
    }

    const latestBlock = await polygonProvider.getBlockNumber();
    const fromBlock = Math.max(latestBlock - 2000, 0); // scan last ~2000 blocks (~1-2h)

    console.log(`Monitoring ${awaitingOrders.length} orders for contract payments from block ${fromBlock} to ${latestBlock}...`);

    for (const order of awaitingOrders) {
      try {
        const orderIdBytes32 = toBytes32OrderId(order._id);
        if (!orderIdBytes32) {
          continue;
        }

        // Filter PaymentReceived(orderId)
        const filter = paymentRouter.filters.PaymentReceived(orderIdBytes32, null, null, null, null);
        const events = await paymentRouter.queryFilter(filter, fromBlock, latestBlock);

        for (const ev of events) {
          const { payer, seller, token, amount } = ev.args;
          const txHash = ev.log.transactionHash;

          // Validate token and seller
          if (!ALLOWED_PAYMENT_TOKENS_LOWER.includes(token.toLowerCase())) {
            console.log(`Ignored payment for order ${order._id}: token not allowed`);
            continue;
          }
          if (seller.toLowerCase() !== order.sellerWallet.toLowerCase()) {
            console.log(`Ignored payment for order ${order._id}: seller mismatch`);
            continue;
          }

          // Amount check - convert from token decimals to USD equivalent
          // USDC/USDT use 6 decimals, AKOFA may use different decimals
          // For now, assume all tokens use 6 decimals (update if AKOFA uses different)
          const tokenDecimals = 6; // Update if AKOFA uses different decimals
          const paid = parseFloat(ethers.formatUnits(amount, tokenDecimals));
          
          // Convert paid amount from selected currency to USD for comparison
          const paidCurrency = order.payAsset || order.displayCurrency || 'USDC';
          const paidInUSD = convertPriceFromCurrency(paid, paidCurrency);
          const expected = parseFloat(order.usdcPrice || order.displayPrice);
          if (Math.abs(paidInUSD - expected) > 0.01) {
            console.log(`Ignored payment for order ${order._id}: amount mismatch paid=${paid} ${paidCurrency} (${paidInUSD} USD) expected=${expected} USD`);
            continue;
          }

          // Ensure not processed
          const existingOrderWithTx = await Order.findOne({ transactionHash: txHash });
          if (existingOrderWithTx) {
            console.log(`Transaction ${txHash} already processed for order ${existingOrderWithTx._id}, skipping`);
            continue;
          }

          // Confirmations
          const txReceipt = await polygonProvider.getTransactionReceipt(txHash);
          if (!txReceipt || !txReceipt.blockNumber) {
            console.log(`Tx ${txHash} not confirmed yet`);
            continue;
          }
          const confirmations = latestBlock - txReceipt.blockNumber;
          if (confirmations < 2) {
            console.log(`Tx ${txHash} has only ${confirmations} confirmations, waiting`);
            continue;
          }

          // Update order
          order.status = 'PENDING';
          order.statusHistory.push({ status: 'PENDING', changedAt: new Date() });
          order.paidAmount = paid;
          order.transactionHash = txHash;
          // Determine pay asset based on token address
          if (token.toLowerCase() === USDC_LOWER) {
            order.payAsset = 'USDC';
          } else if (token.toLowerCase() === USDT_LOWER) {
            order.payAsset = 'USDT';
          } else if (token.toLowerCase() === AKOFA_LOWER) {
            order.payAsset = 'AKOFA';
          } else {
            order.payAsset = 'UNKNOWN';
          }
          order.payAddress = order.sellerWallet;

          await order.save();
          await applySubscriptionPaymentIfNeeded(order);

          logTransaction('BLOCKCHAIN_PAYMENT_DETECTED', {
            orderId: order._id,
            transactionHash: txHash,
            amount: paid,
            token: token,
            sellerWallet: order.sellerWallet
          });

          const app = require('../app');
          const io = app.get('io');
          if (io) {
            io.emit('orderStatusChanged', { orderId: order._id, status: 'PENDING' });
          }

          break; // stop after first match for this order
        }
      } catch (error) {
        console.error(`Error checking payments for order ${order._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error monitoring blockchain payments:', error);
  }
};

// Manual payment confirmation (existing SimplePaymentModal flow)
exports.confirmManualPayment = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only allow status change to AWAITING_CONFIRMATION for manual confirmations
    if (status !== 'AWAITING_CONFIRMATION') {
      return res.status(400).json({ error: 'Invalid status for manual confirmation' });
    }

    order.status = status;
    order.statusHistory.push({ status, changedAt: new Date() });
    await order.save();

    // Log transaction
    logTransaction('MANUAL_PAYMENT_CONFIRMATION', {
      orderId,
      status,
      confirmedBy: req.user._id
    });

    res.json({ message: 'Payment confirmation submitted successfully' });
  } catch (error) {
    console.error('Error confirming manual payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

// Update order status (for seller actions)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, newStatus, trackingNumber, deliveryProvider, estimatedDeliveryDate } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate status transitions
    const validTransitions = {
      'PENDING': ['DELIVERING'],
      'DELIVERING': ['COMPLETED'],
      'COMPLETED': ['PENDING_PAY'],
      'PENDING_PAY': ['PAID'],
    };

    if (!validTransitions[order.status] || !validTransitions[order.status].includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status transition' });
    }

    order.status = newStatus;
    order.statusHistory.push({ status: newStatus, changedAt: new Date() });

    if (newStatus === 'DELIVERING') {
      order.trackingNumber = trackingNumber;
      order.deliveryProvider = deliveryProvider;
      order.estimatedDeliveryDate = estimatedDeliveryDate;
    }

    if (newStatus === 'COMPLETED') {
      order.completedAt = new Date();

      // Check if order originated from an auction and close the auction
      const product = await Product.findById(order.productId);
      if (product && product.isAuction) {
        product.status = 'auction_closed';
        await product.save();
      }
    }

    await order.save();

    // Log transaction
    logTransaction('ORDER_STATUS_UPDATE', {
      orderId,
      oldStatus: order.status,
      newStatus,
      trackingNumber,
      deliveryProvider,
      estimatedDeliveryDate,
    });

    // Emit real-time update
    const app = require('../app');
    const io = app.get('io');
    if (io) {
      io.emit('orderStatusChanged', { orderId: order._id, status: newStatus });
    }

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

