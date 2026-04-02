const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');

/**
 * Authenticate incoming requests by validating the Bearer JWT.
 *
 * Attaches `req.user` on success so downstream middleware and controllers
 * can read the authenticated user without additional DB lookups.
 */
const authenticate = async (req, res, next) => {
  try {
    // ── 1. Extract token from Authorization header ────────────────────────────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, {
        statusCode: 401,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // ── 2. Verify signature and expiry ────────────────────────────────────────
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Token has expired. Please log in again.'
          : 'Invalid token. Please log in again.';

      return sendError(res, { statusCode: 401, message });
    }

    // ── 3. Confirm the user still exists and is active ────────────────────────
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return sendError(res, {
        statusCode: 401,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.status === 'inactive') {
      return sendError(res, {
        statusCode: 403,
        message: 'Your account has been deactivated. Contact an administrator.',
      });
    }

    // ── 4. Attach user and proceed ────────────────────────────────────────────
    req.user = user;
    next();
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Authentication error.',
    });
  }
};

module.exports = authenticate;
