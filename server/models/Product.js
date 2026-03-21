const mongoose = require('mongoose');
const { STATUS_VALUES } = require('../config/constants');

/**
 * Product model — versioned product record. On ECO apply with versionUpdate=true,
 * a new Product document is created and the old one is Archived.
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    salePrice: {
      type: Number,
      required: [true, 'Sale price is required'],
      min: 0,
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: 0,
    },
    attachments: {
      type: [String],
      default: [],
    },
    version: {
      type: String,
      default: 'v1',
    },
    status: {
      type: String,
      enum: Object.values(STATUS_VALUES),
      default: STATUS_VALUES.ACTIVE,
    },
    /** Reference to the original product name-group (first version's _id). Used for version history. */
    rootProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
