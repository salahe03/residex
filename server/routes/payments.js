const express = require('express');
const router = express.Router();
const {
  getAllPayments,
  getUserPayments,
  createBulkPayments,
  markPaymentPaid,
  updatePayment,
  deletePayment,
  getPaymentStats
} = require('../controllers/paymentController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Apply authentication to all payment routes
router.use(authenticateToken);

// GET /api/payments/stats - Get payment statistics (Admin only)
router.get('/stats', requireAdmin, getPaymentStats);

// GET /api/payments/user/:userId - Get payments for specific user
router.get('/user/:userId', getUserPayments);

// GET /api/payments - Get all payments (Admin only)
router.get('/', requireAdmin, getAllPayments);

// POST /api/payments/bulk-create - Create bulk payments for all residents (Admin only)
router.post('/bulk-create', requireAdmin, createBulkPayments);

// PUT /api/payments/:id/mark-paid - Mark payment as paid (Admin only)
router.put('/:id/mark-paid', requireAdmin, markPaymentPaid);

// PUT /api/payments/:id - Update payment (Admin only)
router.put('/:id', requireAdmin, updatePayment);

// DELETE /api/payments/:id - Delete payment (Admin only)
router.delete('/:id', requireAdmin, deletePayment);

module.exports = router;