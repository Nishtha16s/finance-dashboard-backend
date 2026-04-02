const User = require('../models/User');
const { sendSuccess, sendError, buildPaginationMeta } = require('../utils/response');

/**
 * @desc    Get all users (with pagination and filtering)
 * @route   GET /api/v1/users
 * @access  Admin only
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    // Build dynamic filter
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      message: 'Users fetched successfully.',
      data: { users: users.map((u) => u.toPublicJSON()) },
      meta: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single user by ID
 * @route   GET /api/v1/users/:id
 * @access  Admin only
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, { statusCode: 404, message: 'User not found.' });
    }

    return sendSuccess(res, {
      message: 'User fetched successfully.',
      data: { user: user.toPublicJSON() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role and/or status
 * @route   PATCH /api/v1/users/:id
 * @access  Admin only
 */
const updateUser = async (req, res, next) => {
  try {
    const { role, status, name } = req.body;

    // Prevent admin from deactivating or downgrading their own account
    if (req.params.id === req.user._id.toString()) {
      if (status === 'inactive') {
        return sendError(res, {
          statusCode: 400,
          message: 'You cannot deactivate your own account.',
        });
      }
      if (role && role !== req.user.role) {
        return sendError(res, {
          statusCode: 400,
          message: 'You cannot change your own role.',
        });
      }
    }

    const updateFields = {};
    if (role !== undefined) updateFields.role = role;
    if (status !== undefined) updateFields.status = status;
    if (name !== undefined) updateFields.name = name;

    if (Object.keys(updateFields).length === 0) {
      return sendError(res, {
        statusCode: 400,
        message: 'No valid fields provided for update.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      return sendError(res, { statusCode: 404, message: 'User not found.' });
    }

    return sendSuccess(res, {
      message: 'User updated successfully.',
      data: { user: user.toPublicJSON() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft-delete a user
 * @route   DELETE /api/v1/users/:id
 * @access  Admin only
 */
const deleteUser = async (req, res, next) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, {
        statusCode: 400,
        message: 'You cannot delete your own account.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { deletedAt: new Date(), status: 'inactive' } },
      { new: true }
    );

    if (!user) {
      return sendError(res, { statusCode: 404, message: 'User not found.' });
    }

    return sendSuccess(res, { message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
