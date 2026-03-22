/**
 * Frontend mirror of server/config/constants.js.
 * Single source of truth for all UI-side constants.
 */

export const ROLES = {
  ENGINEERING: 'engineering',
  APPROVER: 'approver',
  OPERATIONS: 'operations',
  ADMIN: 'admin',
};

export const ECO_TYPES = {
  PRODUCT: 'Product',
  BOM: 'BoM',
};

export const STATUS_VALUES = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
};

export const ECO_STATUS = {
  OPEN: 'Open',
  APPLIED: 'Applied',
  REJECTED: 'Rejected',
};

export const DIFF_COLORS = {
  ADDED: 'green',
  REDUCED: 'red',
  UNCHANGED: 'neutral',
};

export const MODULES = {
  PRODUCTS: 'products',
  BOM: 'bom',
  ECO: 'eco',
  REPORTS: 'reports',
  SETTINGS: 'settings',
};
