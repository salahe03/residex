const Expense = require('../models/Expense');

// GET /api/expenses?month=YYYY-MM&category=&q=
const getExpenses = async (req, res) => {
  try {
    const { month, category, q } = req.query;
    const query = {};
    if (month) {
      const [y, m] = month.split('-').map(n => parseInt(n, 10));
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
    if (category && category !== 'all') query.category = category;
    if (q) query.$text = { $search: q };

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .populate('createdBy', 'name email');

    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ success: false, error: 'Server error while fetching expenses' });
  }
};

// POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const { amount, description, category, date, vendor = '', notes = '', receiptUrl = '' } = req.body;
    if (!amount || !description || !category || !date) {
      return res.status(400).json({ success: false, error: 'Amount, description, category and date are required' });
    }
    const expense = await Expense.create({
      amount: parseFloat(amount),
      description: description.trim(),
      category,
      date: new Date(date),
      vendor: vendor.trim(),
      notes: notes.trim(),
      receiptUrl: receiptUrl.trim(),
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ success: false, error: 'Server error while creating expense' });
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const { amount, description, category, date, vendor = '', notes = '', receiptUrl = '' } = req.body;
    if (!amount || !description || !category || !date) {
      return res.status(400).json({ success: false, error: 'Amount, description, category and date are required' });
    }
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        amount: parseFloat(amount),
        description: description.trim(),
        category,
        date: new Date(date),
        vendor: vendor.trim(),
        notes: notes.trim(),
        receiptUrl: receiptUrl.trim()
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ success: false, error: 'Server error while updating expense' });
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, data: { deletedExpenseId: req.params.id } });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ success: false, error: 'Server error while deleting expense' });
  }
};

// GET /api/expenses/stats?year=YYYY
const getExpenseStats = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 0, 23, 59, 59, 999);

    const [monthlyAgg, categoryAgg, ytdAgg] = await Promise.all([
      Expense.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
      const found = monthlyAgg.find(m => m._id === i + 1);
      return found ? found.total : 0;
    });

    const categoryTotals = {};
    categoryAgg.forEach(c => { categoryTotals[c._id] = c.total; });

    const now = new Date();
    const currentMonth = now.getFullYear() === year ? now.getMonth() : -1;
    const monthTotal = currentMonth >= 0 ? monthlyTotals[currentMonth] : 0;

    res.json({
      success: true,
      data: {
        year,
        monthlyTotals,
        categoryTotals,
        grandTotal: ytdAgg[0]?.total || 0,
        currentMonthTotal: monthTotal
      }
    });
  } catch (err) {
    console.error('Error building expense stats:', err);
    res.status(500).json({ success: false, error: 'Server error while building expense stats' });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats
};