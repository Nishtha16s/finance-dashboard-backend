/**
 * Standardised API response helpers.
 *
 * Every response from this API follows the same envelope:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: any,
 *   meta?: object   // pagination, counts, etc.
 *   errors?: any    // validation error details
 * }
 *
 * Using a consistent envelope makes frontend integration predictable and
 * simplifies error handling across the client.
 */

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {object} options
 */
const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {object} options
 */
const sendError = (res, { statusCode = 500, message = 'Internal Server Error', errors = null } = {}) => {
  const payload = { success: false, message };
  if (errors !== null) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

/**
 * Build pagination metadata from query params.
 * @param {number} total - Total documents matching filter
 * @param {number} page  - Current page (1-indexed)
 * @param {number} limit - Page size
 */
const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

module.exports = { sendSuccess, sendError, buildPaginationMeta };
