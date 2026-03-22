/**
 * Single source of truth for all business logic constants.
 * All controllers, middleware, and models import from here.
 */

const ROLES = {
  ENGINEERING: 'engineering',
  APPROVER: 'approver',
  OPERATIONS: 'operations',
  ADMIN: 'admin',
};

const ECO_TYPES = {
  PRODUCT: 'Product',
  BOM: 'BoM',
};

const STATUS_VALUES = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
};

const ECO_STATUS = {
  OPEN: 'Open',
  APPLIED: 'Applied',
  REJECTED: 'Rejected',
};

const DEFAULT_STAGES = [
  { name: 'New',      order: 1, requiresApproval: false, isFinal: false },
  { name: 'Approval', order: 2, requiresApproval: true,  isFinal: false },
  { name: 'Done',     order: 3, requiresApproval: false, isFinal: true  },
];

const VERSION_PREFIX = 'v';

const AUDIT_ACTIONS = {
  ECO_CREATED:        'ECO_CREATED',
  STAGE_TRANSITION:   'STAGE_TRANSITION',
  ECO_APPROVED:       'ECO_APPROVED',
  ECO_REJECTED:       'ECO_REJECTED',
  ECO_APPLIED:        'ECO_APPLIED',
  VERSION_CREATED:    'VERSION_CREATED',
  RECORD_ARCHIVED:    'RECORD_ARCHIVED',
  PRODUCT_UPDATED:    'PRODUCT_UPDATED',
  BOM_UPDATED:        'BOM_UPDATED',
};

module.exports = {
  ROLES,
  ECO_TYPES,
  STATUS_VALUES,
  ECO_STATUS,
  DEFAULT_STAGES,
  VERSION_PREFIX,
  AUDIT_ACTIONS,
};
