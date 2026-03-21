const mongoose = require('mongoose');
const { STATUS_VALUES } = require('../config/constants');

/** Sub-schema for BOM components. */
const componentSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

/** Sub-schema for BOM operations. */
const operationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 0 }, // minutes
    workCenter: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

/**
 * BOM model — versioned Bill of Materials linked to a Product.
 * On ECO apply with versionUpdate=true, a new BOM document is created
 * and the old one is Archived.
 */
const bomSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    version: {
      type: String,
      default: 'v1',
    },
    components: {
      type: [componentSchema],
      default: [],
    },
    operations: {
      type: [operationSchema],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(STATUS_VALUES),
      default: STATUS_VALUES.ACTIVE,
    },
    rootBOM: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BOM',
      default: null,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BOM', bomSchema);
