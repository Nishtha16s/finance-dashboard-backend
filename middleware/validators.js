const { body, query, param, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');
const { ROLES, USER_STATUS, TRANSACTION_TYPES } = require('../config/constants');

/**
 * Run after validation chains to collect and return any errors.
 * If errors exist, returns a 400 with structured error details.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, {
      statusCode: 400,
      message: 'Validation failed. Please check your input.',
      errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('role')
    .optional()
    .isIn(Object.values(ROLES)).withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),

  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

// ─── User Management Validators ───────────────────────────────────────────────

const validateUpdateUser = [
  param('id')
    .isMongoId().withMessage('Invalid user ID format'),

  body('role')
    .optional()
    .isIn(Object.values(ROLES)).withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),

  body('status')
    .optional()
    .isIn(Object.values(USER_STATUS)).withMessage(`Status must be one of: ${Object.values(USER_STATUS).join(', ')}`),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  handleValidationErrors,
];

// ─── Financial Record Validators ──────────────────────────────────────────────

const validateCreateRecord = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number greater than 0'),

  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(Object.values(TRANSACTION_TYPES)).withMessage(`Type must be one of: ${Object.values(TRANSACTION_TYPES).join(', ')}`),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date (e.g. 2024-01-15)'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Note cannot exceed 500 characters'),

  handleValidationErrors,
];

const validateUpdateRecord = [
  param('id')
    .isMongoId().withMessage('Invalid record ID format'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number greater than 0'),

  body('type')
    .optional()
    .isIn(Object.values(TRANSACTION_TYPES)).withMessage(`Type must be one of: ${Object.values(TRANSACTION_TYPES).join(', ')}`),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Note cannot exceed 500 characters'),

  handleValidationErrors,
];

const validateRecordFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('type')
    .optional()
    .isIn(Object.values(TRANSACTION_TYPES)).withMessage(`Type must be one of: ${Object.values(TRANSACTION_TYPES).join(', ')}`),

  query('startDate')
    .optional()
    .isISO8601().withMessage('startDate must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601().withMessage('endDate must be a valid ISO 8601 date'),

  handleValidationErrors,
];

const validateMongoId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateUser,
  validateCreateRecord,
  validateUpdateRecord,
  validateRecordFilters,
  validateMongoId,
};
