const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validateUpdateUser, validateMongoId } = require('../middleware/validators');

/**
 * User Routes
 * Base path: /api/v1/users
 * All routes require authentication + admin-level permission
 */

router.use(authenticate);
router.use(authorize('manage_users'));

// @route   GET /api/v1/users
// @desc    Get all users (paginated, filterable)
// @access  Admin
router.get('/', getAllUsers);

// @route   GET /api/v1/users/:id
// @desc    Get a single user by ID
// @access  Admin
router.get('/:id', validateMongoId, getUserById);

// @route   PATCH /api/v1/users/:id
// @desc    Update user role/status/name
// @access  Admin
router.patch('/:id', validateUpdateUser, updateUser);

// @route   DELETE /api/v1/users/:id
// @desc    Soft-delete a user
// @access  Admin
router.delete('/:id', validateMongoId, deleteUser);

module.exports = router;
