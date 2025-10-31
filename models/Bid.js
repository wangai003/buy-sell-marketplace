const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BidSchema = new Schema(
  {
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('bid', BidSchema);