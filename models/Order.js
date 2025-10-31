const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  buyerName: {
    type: String,
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sellerName: {
    type: String,
    required: true,
  },
  sellerWallet: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['AWAITING_PAYMENT', 'PENDING', 'DELIVERING', 'COMPLETED', 'PENDING_PAY', 'PAID', 'DISPUTED'],
    default: 'AWAITING_PAYMENT',
  },
  trackingNumber: {
    type: String,
  },
  deliveryProvider: {
    type: String,
  },
  estimatedDeliveryDate: {
    type: Date,
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['AWAITING_PAYMENT', 'PENDING', 'DELIVERING', 'COMPLETED', 'PENDING_PAY', 'PAID', 'DISPUTED'],
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  paidAmount: {
    type: Number,
  },
  token: {
    type: String,
  },
  transactionHash: {
    type: String,
  },
  platformFee: {
    type: Number,
  },
  sellerPayout: {
    type: Number,
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,
  },
  displayCurrency: {
    type: String,
    required: true,
  },
  displayPrice: {
    type: Number,
    required: true,
  },
  usdcPrice: {
    type: Number,
    required: true,
  },
  paylink: {
    type: String,
  },
});

module.exports = mongoose.model('Order', orderSchema);