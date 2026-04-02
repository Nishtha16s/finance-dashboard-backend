const FinancialRecord = require('../models/FinancialRecord');
const { sendSuccess, sendError, buildPaginationMeta } = require('../utils/response');

/**
 * @desc    Create a new financial record
 * @route   POST /api/v1/records
 * @access  Admin only
 */
const createRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, note } = req.body;

    const record = await FinancialRecord.create({
      amount,
      type,
      category,
      date: date || new Date(),
      note,
      createdBy: req.user._id,
    });

    await record.populate('createdBy', 'name email');

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Financial record created successfully.',
      data: { record },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all financial records with filtering and pagination
 * @route   GET /api/v1/records
 * @access  All authenticated roles
 */
const getAllRecords = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    // ── Build filter object from query params ──────────────────────────────
    const filter = {};

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.category) {
      // Case-insensitive partial match
      filter.category = { $regex: req.query.category, $options: 'i' };
    }

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        // Include the full end date by setting time to 23:59:59
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (req.query.search) {
      filter.$or = [
        { category: { $regex: req.query.search, $options: 'i' } },
        { note: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // ── Determine sort order ───────────────────────────────────────────────
    const sortField = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const [records, total] = await Promise.all([
      FinancialRecord.find(filter)
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      FinancialRecord.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      message: 'Records fetched successfully.',
      data: { records },
      meta: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single financial record by ID
 * @route   GET /api/v1/records/:id
 * @access  All authenticated roles
 */
const getRecordById = async (req, res, next) => {
  try {
    const record = await FinancialRecord.findById(req.params.id).populate(
      'createdBy updatedBy',
      'name email'
    );

    if (!record) {
      return sendError(res, { statusCode: 404, message: 'Financial record not found.' });
    }

    return sendSuccess(res, {
      message: 'Record fetched successfully.',
      data: { record },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a financial record
 * @route   PUT /api/v1/records/:id
 * @access  Admin only
 */
const updateRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, note } = req.body;

    const updateFields = { updatedBy: req.user._id };
    if (amount !== undefined) updateFields.amount = amount;
    if (type !== undefined) updateFields.type = type;
    if (category !== undefined) updateFields.category = category;
    if (date !== undefined) updateFields.date = date;
    if (note !== undefined) updateFields.note = note;

    const record = await FinancialRecord.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'name email');

    if (!record) {
      return sendError(res, { statusCode: 404, message: 'Financial record not found.' });
    }

    return sendSuccess(res, {
      message: 'Record updated successfully.',
      data: { record },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft-delete a financial record
 * @route   DELETE /api/v1/records/:id
 * @access  Admin only
 */
const deleteRecord = async (req, res, next) => {
  try {
    const record = await FinancialRecord.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: req.user._id,
        },
      },
      { new: true }
    );

    if (!record) {
      return sendError(res, { statusCode: 404, message: 'Financial record not found.' });
    }

    return sendSuccess(res, { message: 'Record deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};
