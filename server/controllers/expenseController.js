const Expense = require('../models/Expense');
const Payment = require('../models/Payment');

// GET /api/expenses?month=YYYY-MM&category=&q=
const getExpenses = async (req, res) => {
  try {
    const { month, category = 'all', q } = req.query;
    const filter = {};
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      filter.date = { $gte: start, $lte: end };
    }
    if (category && category !== 'all') filter.category = category;
    if (q) filter.$text = { $search: q };

    const data = await Expense.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('allocations.allocatedBy', 'name email');

    res.json({ success: true, data });
  } catch (e) {
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
    ).populate('createdBy', 'name email').populate('allocations.allocatedBy', 'name email');

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

// Helper: finance overview (optional month=YYYY-MM filter)
const computeFinanceOverview = async (month) => {
  let dateRange = {};
  if (month) {
    const [y, m] = month.split('-').map(n => parseInt(n, 10));
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    dateRange = { $gte: start, $lte: end };
  }

  // Confirmed payments revenue
  const paidMatch = { status: 'paid' };
  if (month) paidMatch['confirmation.confirmedAt'] = dateRange;

  const [paidAgg] = await Payment.aggregate([
    { $match: paidMatch },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  // Total expenses (by expense date)
  const expenseMatch = {};
  if (month) expenseMatch.date = dateRange;

  const [expAgg] = await Expense.aggregate([
    { $match: expenseMatch },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  // Allocations (by allocation date)
  const allocMatch = {};
  if (month) allocMatch['allocations.allocatedAt'] = dateRange;

  const [allocAgg] = await Expense.aggregate([
    { $unwind: { path: '$allocations', preserveNullAndEmptyArrays: false } },
    { $match: Object.keys(allocMatch).length ? allocMatch : {} },
    { $group: { _id: null, total: { $sum: '$allocations.amount' } } }
  ]);

  const paidRevenue = paidAgg?.total || 0;
  const totalExpenses = expAgg?.total || 0;
  const allocatedToExpenses = allocAgg?.total || 0;
  const fundBalance = paidRevenue - allocatedToExpenses;
  const outstandingExpenses = totalExpenses - allocatedToExpenses;

  return { paidRevenue, totalExpenses, allocatedToExpenses, fundBalance, outstandingExpenses };
};

// POST /api/expenses/:id/allocate { amount, note }
const allocateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, note = '' } = req.body;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return res.status(400).json({ success: false, error: 'Amount must be greater than 0' });

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });

    const allocatedSoFar = (expense.allocations || []).reduce((s, a) => s + (a.amount || 0), 0);
    const remainingForExpense = Math.max(0, Number(expense.amount || 0) - allocatedSoFar);

    // Use overall fund (not month-scoped) to keep it simple
    const { fundBalance } = await computeFinanceOverview();
    const maxAlloc = Math.min(remainingForExpense, fundBalance);
    if (amt > maxAlloc) {
      return res.status(400).json({
        success: false,
        error: `Insufficient funds or exceeds expense remaining. Max allocatable: ${maxAlloc.toFixed(2)}`
      });
    }

    expense.allocations.push({
      amount: amt,
      allocatedBy: req.user._id,
      note
    });

    await expense.save();

    const updated = await Expense.findById(id)
      .populate('createdBy', 'name email')
      .populate('allocations.allocatedBy', 'name email');

    const overview = await computeFinanceOverview();
    res.json({ success: true, message: 'Allocation applied', data: updated, overview });
  } catch (err) {
    console.error('Error allocating expense:', err);
    res.status(500).json({ success: false, error: 'Server error while allocating expense' });
  }
};

// DELETE /api/expenses/:id/allocations/:allocId
const deleteAllocation = async (req, res) => {
  try {
    const { id, allocId } = req.params;

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });

    const before = expense.allocations.length;
    expense.allocations = expense.allocations.filter(a => String(a._id) !== String(allocId));
    if (expense.allocations.length === before) {
      return res.status(404).json({ success: false, error: 'Allocation not found' });
    }

    await expense.save();

    const updated = await Expense.findById(id)
      .populate('createdBy', 'name email')
      .populate('allocations.allocatedBy', 'name email');

    const overview = await computeFinanceOverview();
    res.json({ success: true, message: 'Allocation removed', data: updated, overview });
  } catch (err) {
    console.error('Error deleting allocation:', err);
    res.status(500).json({ success: false, error: 'Server error while deleting allocation' });
  }
};

// GET /api/expenses/overview?month=YYYY-MM
const getFinanceOverview = async (req, res) => {
  try {
    const { month } = req.query;
    const overview = await computeFinanceOverview(month);
    res.json({ success: true, data: overview });
  } catch (err) {
    console.error('Error building finance overview:', err);
    res.status(500).json({ success: false, error: 'Server error while building finance overview' });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  allocateExpense,
  deleteAllocation,
  getFinanceOverview
};