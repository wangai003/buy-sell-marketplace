const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CategorySchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ['category', 'subcategory', 'element'],
      default: 'category',
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'category',
      required: false,
    },
    level: {
      type: Number,
      default: 1, // 1 = category, 2 = subcategory, 3 = element
    },
  },
  { timestamps: true }
);

// Index for efficient querying
CategorySchema.index({ parent: 1, type: 1 });
CategorySchema.index({ level: 1 });

module.exports = mongoose.model('category', CategorySchema);
