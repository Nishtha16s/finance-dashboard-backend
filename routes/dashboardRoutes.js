const express = require('express');
const router = express.Router();

const {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRangeSummary,
} = require('../controllers/dashboardController');

const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

/**
 * Dashboard Routes
 * Base path: /api/v1/dashboard
 *
 * Access: Analyst and Admin (requires 'analytics' permission)
 * Viewers are excluded — analytics are considered higher-privilege read access.
 */

router.use(authenticate);
router.use(authorize('analytics'));

// @route   GET /api/v1/dashboard/summary
// @desc    Total income, expenses, net balance + last 5 transactions
// @access  Analyst, Admin
router.get('/summary', getSummary);

// @route   GET /api/v1/dashboard/categories
// @desc    Category-wise totals (optionally filtered by ?type=income|expense)
// @access  Analyst, Admin
router.get('/categories', getCategoryBreakdown);

// @route   GET /api/v1/dashboard/trends
// @desc    Monthly income/expense trends (?months=12)
// @access  Analyst, Admin
router.get('/trends', getMonthlyTrends);

// @route   GET /api/v1/dashboard/range-summary
// @desc    Summary for a custom date range (?startDate=...&endDate=...)
// @access  Analyst, Admin
router.get('/range-summary', getRangeSummary);

module.exports = router;
