const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  allocateExpense,
  deleteAllocation,
  getFinanceOverview
} = require('../controllers/expenseController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireAdmin);

// Stats + finance overview
router.get('/stats', getExpenseStats);
router.get('/overview', getFinanceOverview);

// CRUD
router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

// Allocations
router.post('/:id/allocate', allocateExpense);
router.delete('/:id/allocations/:allocId', deleteAllocation);

module.exports = router;