/**
 * roleConfig.js
 * Centralized configuration per role — used by dashboards and UI to derive
 * display labels, accent colours, and available quick-actions.
 *
 * NEVER hard-code role strings in components — import from here.
 */

export const ROLE_META = {
  engineering: {
    label: 'Engineering',
    focus: 'Create & Modify ECOs',
    accent: '#0077B6',
    accentLight: '#EAF6FB',
    accentBorder: '#90E0EF',
    badge: { bg: '#DBEAFE', color: '#1D4ED8' },
  },
  approver: {
    label: 'Approver',
    focus: 'Review & Approve',
    accent: '#D97706',
    accentLight: '#FFFBEB',
    accentBorder: '#FDE68A',
    badge: { bg: '#FEF3C7', color: '#92400E' },
  },
  operations: {
    label: 'Operations',
    focus: 'Read-Only View',
    accent: '#059669',
    accentLight: '#ECFDF5',
    accentBorder: '#A7F3D0',
    badge: { bg: '#D1FAE5', color: '#065F46' },
  },
  admin: {
    label: 'Admin',
    focus: 'System Control',
    accent: '#7C3AED',
    accentLight: '#F5F3FF',
    accentBorder: '#DDD6FE',
    badge: { bg: '#EDE9FE', color: '#4C1D95' },
  },
};

/**
 * getRoleConfig(role)
 * Returns the full config object for a given role string.
 * Falls back to a safe default so the UI never crashes on unknown roles.
 */
export const getRoleConfig = (role) =>
  ROLE_META[role] ?? {
    label: role ?? 'User',
    focus: 'Dashboard',
    accent: '#0077B6',
    accentLight: '#EAF6FB',
    accentBorder: '#CAF0F8',
    badge: { bg: '#EAF6FB', color: '#0077B6' },
  };
