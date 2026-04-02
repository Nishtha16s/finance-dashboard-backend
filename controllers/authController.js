const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check for existing account
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, {
        statusCode: 400,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({ name, email, password, role });

    const token = generateToken({ id: user._id, role: user.role });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Account created successfully.',
      data: {
        user: user.toPublicJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user and return JWT
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (excluded by default in schema)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Use a generic message to avoid confirming whether the email exists
      return sendError(res, {
        statusCode: 401,
        message: 'Invalid email or password.',
      });
    }

    if (user.status === 'inactive') {
      return sendError(res, {
        statusCode: 403,
        message: 'Your account is inactive. Please contact an administrator.',
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return sendError(res, {
        statusCode: 401,
        message: 'Invalid email or password.',
      });
    }

    // Update last login timestamp (fire-and-forget, no await needed)
    user.lastLogin = new Date();
    user.save({ validateBeforeSave: false });

    const token = generateToken({ id: user._id, role: user.role });

    return sendSuccess(res, {
      message: 'Login successful.',
      data: {
        user: user.toPublicJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user's profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, {
      message: 'Profile fetched successfully.',
      data: { user: req.user.toPublicJSON() },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
