const mongoose = require('mongoose');

/**
 * ECOStage model — defines the ordered stages an ECO moves through.
 * Configurable via the Settings API (admin only).
 */
const ecoStageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Stage name is required'],
      trim: true,
    },
    order: {
      type: Number,
      required: [true, 'Stage order is required'],
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    isFinal: {
      type: Boolean,
      default: false,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
  },
  { timestamps: true }
);

// Stage names must be unique within a company
ecoStageSchema.index({ name: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.model('ECOStage', ecoStageSchema);
