const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const {
  getExpenses,
  getExpenseStats,
  getFinanceOverview,
  createExpense,
  updateExpense,
  deleteExpense,
  allocateExpense,
  deleteAllocation
} = require('../controllers/expenseController');

router.use(authenticateToken);

// Reads (admin-only in your app)
router.get('/', requireAdmin, getExpenses);
router.get('/stats', requireAdmin, getExpenseStats);
router.get('/overview', requireAdmin, getFinanceOverview);

// Writes (admin-only)
router.post('/', requireAdmin, createExpense);
router.put('/:id', requireAdmin, updateExpense);
router.delete('/:id', requireAdmin, deleteExpense);
router.post('/:id/allocate', requireAdmin, allocateExpense);
router.delete('/:id/allocations/:allocId', requireAdmin, deleteAllocation);

module.exports = router;