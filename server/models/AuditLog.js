const mongoose = require('mongoose');
const { AUDIT_ACTIONS } = require('../config/constants');

/**
 * AuditLog model — immutable record of every system event.
 * Written via auditUtils.logAudit(); never modified after creation.
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTIONS),
      required: true,
    },
    affectedModel: {
      type: String,
      enum: ['ECO', 'Product', 'BOM'],
      required: true,
    },
    affectedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }
);

auditLogSchema.index({ companyId: 1, timestamp: -1 });

// Prevent modification after creation (audit immutability)
auditLogSchema.set('timestamps', false);

module.exports = mongoose.model('AuditLog', auditLogSchema);
