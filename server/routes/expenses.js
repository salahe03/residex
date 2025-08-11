const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats
} = require('../controllers/expenseController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getExpenseStats);
router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;