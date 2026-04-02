const { PERMISSIONS, ROLES } = require('../config/constants');
const { sendError } = require('../utils/response');

/**
 * Authorise based on required permission level.
 *
 * Usage in routes:
 *   router.post('/records', authenticate, authorize('write'), createRecord);
 *   router.get('/users',    authenticate, authorize('manage_users'), getUsers);
 *
 * The permission system is additive: higher roles inherit lower permissions.
 * See config/constants.js for the PERMISSIONS matrix.
 *
 * @param {...string} requiredPermissions - One or more permissions required
 */
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    // req.user is guaranteed to exist here (set by authenticate middleware)
    const userPermissions = PERMISSIONS[req.user.role] || [];

    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return sendError(res, {
        statusCode: 403,
        message: `Access forbidden. Your role (${req.user.role}) does not have permission to perform this action.`,
      });
    }

    next();
  };
};

/**
 * Restrict access to specific roles.
 *
 * Usage:
 *   router.get('/users', authenticate, restrictTo(ROLES.ADMIN), getUsers);
 *
 * @param {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: `Access forbidden. This endpoint is restricted to: ${roles.join(', ')}.`,
      });
    }
    next();
  };
};

module.exports = { authorize, restrictTo };
