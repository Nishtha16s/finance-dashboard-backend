const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { validateRegister, validateLogin } = require('../middleware/validators');

/**
 * Auth Routes
 * Base path: /api/v1/auth
 */

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegister, register);

// @route   POST /api/v1/auth/login
// @desc    Login and receive JWT
// @access  Public
router.post('/login', validateLogin, login);

// @route   GET /api/v1/auth/me
// @desc    Get the current authenticated user's profile
// @access  Private (any authenticated user)
router.get('/me', authenticate, getMe);

module.exports = router;
