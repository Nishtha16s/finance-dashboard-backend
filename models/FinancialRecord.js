const mongoose = require('mongoose');
const { TRANSACTION_TYPES } = require('../config/constants');

const financialRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: Object.values(TRANSACTION_TYPES),
        message: 'Type must be either "income" or "expense"',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: '',
    },
    // Track who created / last modified the record
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Soft-delete support
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
financialRecordSchema.index({ date: -1 });
financialRecordSchema.index({ type: 1, category: 1 });
financialRecordSchema.index({ date: -1, type: 1 });
financialRecordSchema.index({ deletedAt: 1 });

// ─── Query Helpers ────────────────────────────────────────────────────────────

// Automatically exclude soft-deleted records unless explicitly requested
financialRecordSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// ─── Statics ──────────────────────────────────────────────────────────────────

/**
 * Returns aggregated totals for income, expenses, and net balance.
 */
financialRecordSchema.statics.getSummary = async function () {
  const result = await this.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
  result.forEach(({ _id, total, count }) => {
    if (_id === 'income') {
      summary.income = total;
      summary.incomeCount = count;
    } else {
      summary.expense = total;
      summary.expenseCount = count;
    }
  });
  summary.netBalance = summary.income - summary.expense;

  return summary;
};

/**
 * Returns category-wise aggregated totals.
 * @param {string} [type] - Optional filter: 'income' | 'expense'
 */
financialRecordSchema.statics.getCategoryTotals = async function (type) {
  const match = { deletedAt: null };
  if (type) match.type = type;

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        category: '$_id.category',
        type: '$_id.type',
        total: 1,
        count: 1,
      },
    },
  ]);
};

/**
 * Returns monthly income/expense totals for the last N months.
 * @param {number} months
 */
financialRecordSchema.statics.getMonthlyTrends = async function (months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return this.aggregate([
    { $match: { deletedAt: null, date: { $gte: since } } },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        type: '$_id.type',
        total: 1,
        count: 1,
      },
    },
  ]);
};

const FinancialRecord = mongoose.model('FinancialRecord', financialRecordSchema);

module.exports = FinancialRecord;
