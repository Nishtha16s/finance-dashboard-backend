/**
 * Global error handling middleware.
 *
 * Express recognises a 4-argument middleware as an error handler.
 * This is the single, centralised place where all unhandled errors are
 * formatted and returned to the client — ensuring consistent error responses.
 */

const { sendError } = require('../utils/response');

// ─── Custom Application Error Class ──────────────────────────────────────────

class AppError extends Error {
  /**
   * @param {string} message  - Human-readable error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes our errors from unexpected crashes
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Error Normalisation Helpers ──────────────────────────────────────────────

/** Handle Mongoose CastError (e.g. invalid ObjectId) */
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}.`, 400);

/** Handle Mongoose duplicate key error */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(
    `Duplicate value for field "${field}": "${value}". Please use a different value.`,
    400
  );
};

/** Handle Mongoose validation errors */
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message).join('. ');
  return new AppError(`Validation Error: ${messages}`, 400);
};

// ─── Main Error Handler ───────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message };

  // Log unexpected errors in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error:', err);
  }

  // ── Normalise known Mongoose/JWT error types ───────────────────────────────
  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);

  // ── Build response ─────────────────────────────────────────────────────────
  const statusCode = error.statusCode || 500;
  const message =
    error.isOperational
      ? error.message
      : 'Something went wrong on our end. Please try again later.';

  const response = { statusCode, message };

  // Include stack trace in development for debugging
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return sendError(res, response);
};

module.exports = { AppError, errorHandler };
