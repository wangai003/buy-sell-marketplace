const { HelioSDK } = require('@heliofi/sdk');
const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
let horizon; // can be used for read methods too if needed

// Helio payment creation
exports.createPayment = async (req, res) => {
  try {
    const { productId, buyerId, sellerId, amountUSD, quantity = 1, currency } = req.body;

    if (!productId || !buyerId || !sellerId || !amountUSD) {
      return res.status(400).json({ error: 'productId, buyerId, sellerId, and amountUSD are required' });
    }

    // Validate quantity
    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
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

    // Calculate total price in display currency (USD for Helio)
    const displayPrice = amountUSD * quantity;

    // For Helio, currency is USD, so usdcPrice is the same
    const usdcPrice = displayPrice;

    // Create order
    const order = new Order({
      productId,
      productName: product.name,
      buyerId,
      buyerName: buyer.name,
      sellerId,
      sellerName: seller.name,
      status: 'AWAITING_PAYMENT',
      price: usdcPrice, // Store USDC amount for payment
      quantity,
      payAsset: 'USD',
      receivedAmount: 0,
      displayCurrency: currency || 'USD',
      displayPrice,
      usdcPrice
    });

    await order.save();

    // Create Helio payment request
    const paymentRequest = await helioApi.createPaymentRequest({
      amount: amountUSD,
      currency: 'USD',
      name: `Payment for ${product.name}`,
      description: `Order #${order._id}`,
      // Add other required fields as per Helio API
    });

    // Update order with payment details
    order.transactionHash = paymentRequest.id;
    await order.save();

    // Log transaction
    logTransaction('PAYMENT_CREATED', {
      orderId: order._id,
      productId,
      buyerId,
      sellerId,
      amountUSD,
      paymentId: paymentRequest.id,
    });

    res.json({
      orderId: order._id,
      paymentUrl: paymentRequest.url,
      paymentId: paymentRequest.id,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment', detail: error.message });
  }
};

// Route handler at top level, always available to Express
exports.createStellarPayment = async (req, res) => {
  try {
    const { productId, buyerId, sellerId, quantity = 1, currency } = req.body;
    const product = await Product.findById(productId);
    const buyer = await User.findById(buyerId);
    const seller = await User.findById(sellerId);
    if (!product || !buyer || !seller) return res.status(404).json({ error: 'Not found' });

    // Validate required fields
    if (!product.name || !buyer.name || !seller.name) {
      return res.status(400).json({ error: 'Product, buyer, or seller missing required fields' });
    }

    // Validate quantity
    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    const sellerWallet = 'GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A';

    // Calculate total price in display currency
    const displayPrice = product.price * quantity;

    // For Stellar payments, use the display price directly (no conversion needed)
    // Convert to USDC only for internal storage
    const { convertCurrencyToUSDC } = require('../utils/currency');
    const usdcPrice = await convertCurrencyToUSDC(displayPrice, currency || 'USDC');

    // Create order/memo
    const order = new Order({
      productId,
      productName: product.name,
      price: usdcPrice, // Store USDC amount for payment
      quantity,
      buyerId,
      buyerName: buyer.name,
      sellerId,
      sellerName: seller.name,
      sellerWallet,
      status: 'AWAITING_PAYMENT',
      payAsset: 'XLM',
      receivedAmount: 0,
      payAddress: sellerWallet,
      displayCurrency: currency || 'XLM',
      displayPrice,
      usdcPrice
    });
    await order.save();

    // Update memo with actual order._id after save
    order.memo = order._id.toString();
    await order.save();

    // Determine asset based on currency
    let assetParam = '';
    if (currency === 'USDC') {
      assetParam = '&asset_code=USDC&asset_issuer=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
    } else if (currency === 'EURC') {
      assetParam = '&asset_code=EURC&asset_issuer=GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX';
    } else if (currency === 'AKOFA') {
      assetParam = '&asset_code=AKOFA&asset_issuer=GBXLZ3FG6T7Q4P7X5Z6Z7Q4P7X5Z6Z7Q4P7X5Z6Z7Q4P7X5Z6Z7Q4P7';
    } else {
      // Default to XLM (native)
      assetParam = '&asset_code=XLM';
    }

    const sep7 = `web+stellar:pay?destination=${order.payAddress}&amount=${displayPrice}&memo=${order._id}${assetParam}`;
    res.json({
      orderId: order._id,
      address: order.payAddress,
      amount: displayPrice,
      memo: order._id,
      sep7
    });
  } catch(e){
    console.error('Stellar payment creation error:', e);
    res.status(500).json({ error: 'payment endpoint error', detail: e.message });
  }
};

exports.getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ status: order.status, order });
  } catch (e) {
    res.status(500).json({ error: 'status error', detail: e.message });
  }
};

// Bootstrapping the Stellar watcher/stream setup asynchronously
(async () => {
  try {
    const { Horizon } = await import('@stellar/stellar-sdk');
    horizon = new Horizon.Server('https://horizon.stellar.org');
    const STELLAR_ADDRESS = 'GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A';
    if (STELLAR_ADDRESS) {
      console.log('Setting up Stellar payment stream for address:', STELLAR_ADDRESS);

      // Test if account exists first
      try {
        await horizon.accounts().accountId(STELLAR_ADDRESS).call();
        console.log('Stellar account verified successfully');
      } catch (accountError) {
        console.error('Stellar account does not exist or is invalid:', accountError.message);
        return;
      }

      horizon.payments().forAccount(STELLAR_ADDRESS).stream({
        onmessage: async payment => {
          try {
            console.log('Received Stellar payment:', payment);
            if (payment.type !== 'payment' || !payment.memo) {
              console.log('Ignoring non-payment or payment without memo');
              return;
            }
            const order = await Order.findById(payment.memo).exec();
            if (!order) {
              console.log('Order not found for memo:', payment.memo);
              return;
            }
            if (order.status === 'PAID') {
              console.log('Order already paid:', order._id);
              return;
            }

            // Function to check if payment asset matches order currency
            const isCorrectAsset = (payment, order) => {
              const currency = order.displayCurrency;
              if (currency === 'XLM') {
                return payment.asset_type === 'native';
              } else if (currency === 'USDC') {
                return payment.asset_type === 'credit_alphanum4' && payment.asset_code === 'USDC';
              } else if (currency === 'EURC') {
                return payment.asset_type === 'credit_alphanum4' && payment.asset_code === 'EURC';
              } else if (currency === 'AKOFA') {
                return payment.asset_type === 'credit_alphanum4' && payment.asset_code === 'AKOFA';
              }
              return false;
            };

            // Check amount and asset based on order currency
            if (parseFloat(payment.amount) >= parseFloat(order.displayPrice) && isCorrectAsset(payment, order)) {
              console.log('Payment confirmed for order:', order._id);
              order.status = 'PAID';
              order.receivedAmount = payment.amount;
              order.txId = payment.id;
              await order.save();

              // Log transaction
              logTransaction('STELLAR_PAYMENT_RECEIVED', {
                orderId: order._id,
                amount: payment.amount,
                txId: payment.id,
                memo: payment.memo
              });

              // Emit real-time update
              const app = require('../app');
              const io = app.get('io');
              if (io) {
                io.emit('orderStatusChanged', { orderId: order._id, status: 'PAID' });
              }
            } else {
              console.log('Payment amount or asset mismatch:', {
                received: payment.amount,
                expected: order.price,
                asset: payment.asset_type,
                asset_code: payment.asset_code,
                orderCurrency: order.displayCurrency
              });
            }
          } catch (error) {
            console.error('Error processing Stellar payment:', error);
          }
        },
        onerror: e => console.error('Stellar payment stream error', e)
      });
    } else {
      console.log('No STELLAR_ADDRESS configured, skipping payment stream setup');
    }
  } catch (error) {
    console.error('Error setting up Stellar payment stream:', error);
  }
})();

// Validate Helio configuration early to avoid opaque 500s
const { HELIO_PUBLIC_KEY, HELIO_SECRET_KEY, HELIO_WEBHOOK_SECRET, HELIO_NETWORK, NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_URL, NOWPAYMENTS_PAY_CURRENCY } = process.env;
if (!HELIO_PUBLIC_KEY || !HELIO_SECRET_KEY) {
  // Log once at startup; requests will error with a descriptive message below
  // eslint-disable-next-line no-console
  console.error('Helio keys missing: set HELIO_PUBLIC_KEY and HELIO_SECRET_KEY in server env');
}

const helioApi = new HelioSDK({
  apiKey: HELIO_PUBLIC_KEY,
  secretKey: HELIO_SECRET_KEY,
  network: (HELIO_NETWORK === 'mainnet' ? 'mainnet' : 'devnet'),
});

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

exports.handleWebhook = async (req, res) => {
  try {
    // Validate webhook signature using HMAC
    const crypto = require('crypto');
    const helioSignature = req.headers['x-helio-signature'];
    const secret = HELIO_WEBHOOK_SECRET;
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (!helioSignature || helioSignature !== expectedSignature) {
      return res.status(401).json({ error: 'Unauthorized webhook' });
    }

    const { event, data } = req.body;

    if (event === 'payment.success') {
      const { orderId, transactionHash, token, paidAmount } = data;

      // Update order status to PENDING
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      order.status = 'PENDING';
      order.statusHistory.push({ status: 'PENDING', changedAt: new Date() });
      order.paidAmount = paidAmount;
      order.token = token;
      order.transactionHash = transactionHash;

      await order.save();

      // Log transaction
      logTransaction('PAYMENT_SUCCESS', {
        orderId,
        transactionHash,
        token,
        paidAmount,
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
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
};

// NOWPayments IPN handler
exports.nowpaymentsIpn = async (req, res) => {
  try {
    const { payment_status, order_id, pay_address, pay_amount, pay_currency, payment_id } = req.body || {};

    if (!order_id) {
      return res.status(400).json({ error: 'Missing order_id' });
    }

    // Ignore invalid order ids gracefully (useful for manual tests)
    if (!mongoose.Types.ObjectId.isValid(order_id)) {
      logTransaction('NP_IPN_IGNORED_INVALID_ORDER_ID', { order_id, payment_status });
      return res.status(200).json({ ok: true, ignored: true });
    }

    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Map NOWPayments statuses to internal ones
    const mapStatus = (status) => {
      switch ((status || '').toLowerCase()) {
        case 'waiting':
        case 'partially_paid':
          return 'AWAITING_PAYMENT';
        case 'confirming':
        case 'confirmed':
        case 'finished':
          return 'PENDING';
        case 'failed':
          return 'DISPUTED';
        case 'expired':
          return 'AWAITING_PAYMENT';
        default:
          return order.status;
      }
    };

    const newStatus = mapStatus(payment_status);
    if (newStatus && newStatus !== order.status) {
      order.status = newStatus;
      order.statusHistory.push({ status: newStatus, changedAt: new Date() });
    }

    if (pay_amount) order.paidAmount = Number(pay_amount);
    if (pay_currency) order.token = String(pay_currency);
    if (payment_id) order.transactionHash = String(payment_id);

    await order.save();

    // Log transaction
    logTransaction('NP_IPN', {
      orderId: order._id,
      payment_status,
      payment_id,
      pay_address,
      pay_amount,
      pay_currency,
      newStatus,
    });

    // Emit real-time update
    const app = require('../app');
    const io = app.get('io');
    if (io) {
      io.emit('orderStatusChanged', { orderId: order._id, status: order.status });
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error handling NOWPayments IPN:', error && error.message ? error.message : error);
    res.status(500).json({ error: 'Failed to handle IPN' });
  }
};

// Create NOWPayments hosted invoice (for embedding/redirect)
exports.createNowpaymentsInvoice = async (req, res) => {
  try {
    if (!NOWPAYMENTS_API_KEY) {
      return res.status(500).json({
        error: 'Payment service not configured',
        detail: 'Missing NOWPAYMENTS_API_KEY on server',
      });
    }

    const { productId, buyerId, sellerId, amountUSD, payCurrency, quantity = 1 } = req.body;

    if (!productId || !buyerId || !sellerId || !amountUSD) {
      return res.status(400).json({ error: 'productId, buyerId, sellerId, and amountUSD are required' });
    }

    // Validate quantity
    if (quantity < 1 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    const product = await Product.findById(productId);
    const seller = await User.findById(sellerId);
    const buyer = await User.findById(buyerId);
    if (!product || !seller || !buyer) {
      return res.status(404).json({ error: 'Product, buyer, or seller not found' });
    }

    // Validate required fields
    if (!product.name || !buyer.name || !seller.name) {
      return res.status(400).json({ error: 'Product, buyer, or seller missing required fields' });
    }

    // Calculate total price
    const totalPrice = amountUSD * quantity;

    const invoicePayload = {
      price_amount: Number(totalPrice),
      price_currency: 'usd',
      pay_currency: (payCurrency || NOWPAYMENTS_PAY_CURRENCY || 'btc').toLowerCase(),
      order_id: `${productId}-${Date.now()}`,
      order_description: `Invoice for ${quantity}x ${product.name}`,
      // Optional: success_url/cancel_url could be added here if supported
    };

    const npRes = await axios.post('https://api.nowpayments.io/v1/invoice', invoicePayload, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    const { invoice_url, id: invoice_id } = npRes.data || {};

    logTransaction('NP_INVOICE_CREATED', {
      productId,
      buyerId,
      sellerId,
      amountUSD,
      quantity,
      totalPrice,
      invoice_id,
      invoice_url,
    });

    return res.json({ invoice_url, invoice_id });
  } catch (error) {
    const status = (error && error.response && error.response.status) || undefined;
    const detail =
      (error && error.response && (error.response.data || error.response.text)) ||
      (error && error.message) ||
      'Unknown error';
    // eslint-disable-next-line no-console
    console.error('Error creating NOWPayments invoice:', status ? `${status} ${detail}` : detail);
    res.status(500).json({ error: 'Failed to create invoice', status, detail });
  }
};

// Proxy: list NOWPayments supported currencies (no auth required)
exports.getNowpaymentsCurrencies = async (_req, res) => {
  try {
    const nowpaymentsApiKey = process.env.NOWPAYMENTS_API_KEY;
    const curRes = await axios.get('https://api.nowpayments.io/v1/currencies', { timeout: 15000 });
    let currencies = curRes.data;
    if (currencies && currencies.currencies) currencies = currencies.currencies;
    // Keep only Stellar coins that can be used for payment
    const stellarCoins = currencies.filter(c => c.fiat === false && c.can_pay === true && (c.network && c.network.toLowerCase() === 'stellar'));

    // For LIVE VALIDATION: check which allow estimate USD->token
    const validCoins = [];
    for (let c of stellarCoins) {
      try {
        const estRes = await axios.post('https://api.nowpayments.io/v1/estimate', {
          amount: 10, // probe with $10
          currency_from: 'usd',
          currency_to: c.ticker.toLowerCase(),
        }, {
          headers: {
            'x-api-key': nowpaymentsApiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });
        if (estRes.data && !estRes.data.error && estRes.data.estimated_amount && estRes.data.estimated_amount > 0) {
          validCoins.push(c);
        }
      } catch (err) {
        // Ignore invalid coins
      }
    }
    res.json(validCoins);
  } catch (error) {
    const status = (error && error.response && error.response.status) || undefined;
    const detail = (error && error.response && (error.response.data || error.response.text)) || (error && error.message) || 'Unknown error';
    // eslint-disable-next-line no-console
    console.error('Error fetching NOWPayments currencies:', status ? `${status} ${detail}` : detail);
    res.status(500).json({ error: 'Failed to fetch currencies', status, detail });
  }
};
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