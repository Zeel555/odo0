const mongoose = require('mongoose');
const { ECO_TYPES, ECO_STATUS } = require('../config/constants');

/**
 * ECO (Engineering Change Order) model.
 * proposedChanges is a free JSON object — structure depends on ecoType:
 *   Product ECO: { name, salePrice, costPrice, attachments }
 *   BoM ECO:     { components: [{productId, quantity}], operations: [...] }
 */
const ecoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'ECO title is required'],
      trim: true,
    },
    ecoType: {
      type: String,
      enum: Object.values(ECO_TYPES),
      required: [true, 'ECO type is required'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    bom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BOM',
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    versionUpdate: {
      type: Boolean,
      default: true,
    },
    /** Name of the current ECOStage. */
    stage: {
      type: String,
      required: true,
    },
    /** Free JSON storing proposed field changes before apply. */
    proposedChanges: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: Object.values(ECO_STATUS),
      default: ECO_STATUS.OPEN,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ECO', ecoSchema);
