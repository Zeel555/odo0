const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

/**
 * ApprovalRule model — maps a stage name to the role that can approve it.
 * A stage can have multiple rules (multiple approver roles).
 */
const approvalRuleSchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      required: [true, 'Stage name is required'],
      trim: true,
    },
    approverRole: {
      type: String,
      enum: Object.values(ROLES),
      required: [true, 'Approver role is required'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
