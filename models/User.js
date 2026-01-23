const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32,
    },
    username: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      required: false,
    },
    photo_id: {
      type: String,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 64,
    },
    location: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      default: 'user',
    },
    ratings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'rating',
      },
    ],
    favourites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
    ],
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
      },
    ],
    newMessagePopup: {
      type: Boolean,
      default: false,
    },
    unreadNotification: {
      type: Boolean,
      default: false,
    },
    unreadMessage: {
      type: Boolean,
      default: false,
    },
    wallet: {
      type: String,
      trim: true,
      required: false,
    },
    canSell: {
      type: Boolean,
      default: false,
    },
    businessName: {
      type: String,
      trim: true,
      required: false,
    },
    businessLogo: {
      type: String,
      required: false,
    },
    businessLogo_id: {
      type: String,
    },
    businessPhone: {
      type: String,
      required: false,
    },
    socialMediaLinks: {
      type: Map,
      of: String,
      default: {},
    },
    sellerCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
      },
    ],
    interestedCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
      },
    ],
    connectedBuyers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
    ],
    // Subscription tier and billing
    subscriptionTier: {
      type: String,
      enum: ['FREE', 'STARTER', 'BUSINESS', 'CUSTOM'],
      default: 'FREE',
    },
    subscriptionBillingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    subscriptionActiveUntil: {
      type: Date,
    },
    // Monthly usage tracking
    monthlyConnectionUsage: {
      type: Number,
      default: 0,
    },
    monthlyConnectionUsageResetDate: {
      type: Date,
      default: function() {
        // Set to first day of next month
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      },
    },
    monthlyAdvertisingDaysUsed: {
      type: Number,
      default: 0,
    },
    monthlyAdvertisingDaysResetDate: {
      type: Date,
      default: function() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      },
    },
    monthlyCreativeRequestsUsed: {
      type: Number,
      default: 0,
    },
    monthlyCreativeRequestsResetDate: {
      type: Date,
      default: function() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      },
    },
    // Legacy field for backward compatibility
    connectionsSubscriptionActiveUntil: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('user', UserSchema);
