/**
 * roleGuard.js — single source of truth for all frontend RBAC.
 * NEVER inline role strings in components — always import and use these functions.
 */

// ─── Role predicates ─────────────────────────────────────────
export const isAdmin       = (role) => role === 'admin';
export const isApprover    = (role) => role === 'approver';
export const isEngineering = (role) => role === 'engineering';
export const isOperations  = (role) => role === 'operations';

// ─── ECO permissions ─────────────────────────────────────────
export const canCreateECO   = (role) => ['engineering', 'admin'].includes(role);
export const canEditECO     = (role) => ['engineering', 'admin'].includes(role);
export const canValidateECO = (role) => ['engineering', 'admin'].includes(role);
export const canApproveECO  = (role) => ['approver', 'admin'].includes(role);
export const canRejectECO   = (role) => ['approver', 'admin'].includes(role);
export const canApplyECO    = (role) => role === 'admin';

// ─── Product permissions ──────────────────────────────────────
export const canCreateProduct  = (role) => ['engineering', 'admin'].includes(role);
/** Master data is changed via ECO only — no direct product edit */
export const canEditProduct    = () => false;
export const canArchiveProduct = (role) => role === 'admin';

// ─── BOM permissions ─────────────────────────────────────────
export const canCreateBOM = (role) => ['engineering', 'admin'].includes(role);
/** Master data is changed via ECO only — no direct BOM edit */
export const canEditBOM   = () => false;

// ─── Page/section visibility ──────────────────────────────────
export const canViewSettings  = (role) => role === 'admin';
export const canViewReports   = (role) => ['engineering', 'approver', 'admin'].includes(role);
export const canViewECO       = (role) => true; // all roles can view ECOs
export const canConfigStages  = (role) => ['approver', 'admin'].includes(role);

// ─── Legacy aliases (keep for existing code that uses these) ──
export const canCreate  = (role, module) => {
  if (role === 'admin') return true;
  if (role === 'engineering') return ['products', 'bom', 'eco'].includes(module);
  return false;
};
/** Direct master-data edit is disabled — use ECO */
export const canEdit    = () => false;
export const canApprove = (role) => canApproveECO(role);
export const canValidate = (role) => canValidateECO(role);
export const canManageSettings = canViewSettings;
export const canArchive = (role) => canArchiveProduct(role);
