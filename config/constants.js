/**
 * Application-wide constants.
 * Centralising magic strings here ensures consistent usage across models,
 * middleware, and controllers — and makes future changes trivial.
 */

const ROLES = Object.freeze({
  VIEWER: 'viewer',
  ANALYST: 'analyst',
  ADMIN: 'admin',
});

const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

const TRANSACTION_TYPES = Object.freeze({
  INCOME: 'income',
  EXPENSE: 'expense',
});

// Permissions matrix — maps role → allowed actions
const PERMISSIONS = Object.freeze({
  [ROLES.VIEWER]: ['read'],
  [ROLES.ANALYST]: ['read', 'analytics'],
  [ROLES.ADMIN]: ['read', 'analytics', 'write', 'delete', 'manage_users'],
});

module.exports = { ROLES, USER_STATUS, TRANSACTION_TYPES, PERMISSIONS };
