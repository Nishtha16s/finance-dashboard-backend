const express = require('express');
const router = express.Router();

const {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} = require('../controllers/recordController');

const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const {
  validateCreateRecord,
  validateUpdateRecord,
  validateRecordFilters,
  validateMongoId,
} = require('../middleware/validators');

/**
 * Financial Record Routes
 * Base path: /api/v1/records
 *
 * Access matrix:
 *   GET    → all authenticated roles (viewer, analyst, admin)
 *   POST   → admin only
 *   PUT    → admin only
 *   DELETE → admin only
 */

// All routes require a valid JWT
router.use(authenticate);

// ── Read endpoints (all roles) ─────────────────────────────────────────────

// @route   GET /api/v1/records
// @desc    List records with filtering, search, and pagination
// @access  All authenticated
router.get('/', authorize('read'), validateRecordFilters, getAllRecords);

// @route   GET /api/v1/records/:id
// @desc    Get a single record
// @access  All authenticated
router.get('/:id', authorize('read'), validateMongoId, getRecordById);

// ── Write endpoints (admin only) ───────────────────────────────────────────

// @route   POST /api/v1/records
// @desc    Create a new financial record
// @access  Admin
router.post('/', authorize('write'), validateCreateRecord, createRecord);

// @route   PUT /api/v1/records/:id
// @desc    Update a financial record
// @access  Admin
router.put('/:id', authorize('write'), validateUpdateRecord, updateRecord);

// @route   DELETE /api/v1/records/:id
// @desc    Soft-delete a financial record
// @access  Admin
router.delete('/:id', authorize('delete'), validateMongoId, deleteRecord);

module.exports = router;
