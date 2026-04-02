const FinancialRecord = require('../models/FinancialRecord');
const { sendSuccess } = require('../utils/response');

/**
 * @desc    Get complete dashboard summary (income, expense, balance, recent)
 * @route   GET /api/v1/dashboard/summary
 * @access  Analyst + Admin
 */
const getSummary = async (req, res, next) => {
  try {
    const [summary, recentTransactions] = await Promise.all([
      FinancialRecord.getSummary(),
      FinancialRecord.find()
        .sort({ date: -1 })
        .limit(5)
        .populate('createdBy', 'name email'),
    ]);

    return sendSuccess(res, {
      message: 'Dashboard summary fetched successfully.',
      data: {
        summary,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get category-wise totals (optionally filtered by type)
 * @route   GET /api/v1/dashboard/categories
 * @access  Analyst + Admin
 */
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { type } = req.query; // Optional: 'income' | 'expense'

    const categoryTotals = await FinancialRecord.getCategoryTotals(type);

    // Group by type for easier consumption
    const breakdown = {
      income: [],
      expense: [],
    };

    categoryTotals.forEach((item) => {
      if (breakdown[item.type]) {
        breakdown[item.type].push({
          category: item.category,
          total: item.total,
          count: item.count,
        });
      }
    });

    return sendSuccess(res, {
      message: 'Category breakdown fetched successfully.',
      data: { breakdown },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get monthly income/expense trends
 * @route   GET /api/v1/dashboard/trends
 * @access  Analyst + Admin
 * @query   months - Number of months to look back (default: 12, max: 24)
 */
const getMonthlyTrends = async (req, res, next) => {
  try {
    const months = Math.min(parseInt(req.query.months, 10) || 12, 24);

    const rawTrends = await FinancialRecord.getMonthlyTrends(months);

    // Transform flat aggregation results into a structured monthly series
    // { "2024-01": { income: X, expense: Y, net: Z }, ... }
    const trendsMap = {};

    rawTrends.forEach(({ year, month, type, total, count }) => {
      const key = `${year}-${String(month).padStart(2, '0')}`;
      if (!trendsMap[key]) {
        trendsMap[key] = { period: key, year, month, income: 0, expense: 0, net: 0, incomeCount: 0, expenseCount: 0 };
      }
      trendsMap[key][type] = total;
      trendsMap[key][`${type}Count`] = count;
    });

    // Calculate net balance per month and convert to sorted array
    const trends = Object.values(trendsMap)
      .map((entry) => ({
        ...entry,
        net: entry.income - entry.expense,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return sendSuccess(res, {
      message: 'Monthly trends fetched successfully.',
      data: { months, trends },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get overall stats for a custom date range
 * @route   GET /api/v1/dashboard/range-summary
 * @access  Analyst + Admin
 * @query   startDate, endDate (ISO 8601)
 */
const getRangeSummary = async (req, res, next) => {
  try {
    const filter = { deletedAt: null };

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const result = await FinancialRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' },
        },
      },
    ]);

    const summary = {
      income: { total: 0, count: 0, avg: 0, max: 0, min: 0 },
      expense: { total: 0, count: 0, avg: 0, max: 0, min: 0 },
    };

    result.forEach(({ _id, total, count, avgAmount, maxAmount, minAmount }) => {
      summary[_id] = {
        total,
        count,
        avg: Math.round(avgAmount * 100) / 100,
        max: maxAmount,
        min: minAmount,
      };
    });

    summary.netBalance = summary.income.total - summary.expense.total;

    return sendSuccess(res, {
      message: 'Range summary fetched successfully.',
      data: {
        dateRange: {
          startDate: req.query.startDate || null,
          endDate: req.query.endDate || null,
        },
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends, getRangeSummary };
