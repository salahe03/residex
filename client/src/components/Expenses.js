import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { expenseService } from '../services/expenseService';
import './Expenses.css';

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'water', label: 'Water' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'security', label: 'Security' },
  { value: 'salary', label: 'Salary' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' }
];

const fmtMAD = (n) => `${Number(n || 0).toFixed(2)} MAD`;

const Expenses = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const year = useMemo(() => parseInt(month.slice(0, 4), 10), [month]);

  const loadData = useCallback(async () => {
    // Prevent admin-only calls when not admin
    if (!isAdmin) {
      setLoading(false);
      setError('');
      setExpenses([]);
      setStats(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [list, s] = await Promise.all([
        expenseService.getExpenses({ month, category, q: searchTerm }),
        expenseService.getStats(year)
      ]);
      setExpenses(list.data || []);
      setStats(s.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, month, category, searchTerm, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Move all hooks above; derive memo after hooks
  const topCategory = useMemo(() => {
    if (!stats?.categoryTotals) return '-';
    const entries = Object.entries(stats.categoryTotals);
    if (entries.length === 0) return '-';
    entries.sort((a, b) => b[1] - a[1]);
    return `${entries[0][0]} (${fmtMAD(entries[0][1])})`;
  }, [stats]);

  const handleCreate = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (exp) => { setEditing(exp); setShowForm(true); };
  const handleDelete = async (exp) => {
    if (!window.confirm('Delete this expense?')) return;
    try { setLoading(true); await expenseService.deleteExpense(exp._id); await loadData(); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (loading && !showForm) {
    return <div className="expenses-container"><div className="loading-message"><h3>Loading expenses...</h3><p>Please wait while we fetch the expense information.</p></div></div>;
  }

  if (showForm) {
    return (
      <ExpenseForm
        initial={editing}
        onCancel={() => { setShowForm(false); setEditing(null); }}
        onSaved={async () => { setShowForm(false); setEditing(null); await loadData(); }}
      />
    );
  }

  return (
    <div className="expenses-container">
      <div className="expenses-header">
        <div className="header-title">
          <h2>📊 Expenses</h2>
          <p>Track building expenses</p>
        </div>
        {stats && (
          <div className="expenses-stats">
            <div className="stat-card"><span className="stat-number">{fmtMAD(stats.currentMonthTotal)}</span><span className="stat-label">This Month</span></div>
            <div className="stat-card"><span className="stat-number">{fmtMAD(stats.grandTotal)}</span><span className="stat-label">Year To Date</span></div>
            <div className="stat-card"><span className="stat-number">{topCategory}</span><span className="stat-label">Top Category</span></div>
          </div>
        )}
      </div>

      <div className="expenses-controls">
        <div className="search-filters">
          <input type="text" placeholder="🔍 Search description or vendor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="filter-select" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="filter-select">
            {categories.map(c => (<option key={c.value} value={c.value}>{c.label}</option>))}
          </select>
        </div>
        <button onClick={handleCreate} className="add-expense-btn">+ Add Expense</button>
      </div>

      {error && <div className="error-message">❌ {error}</div>}

      {expenses.length === 0 ? (
        <div className="no-expenses"><h3>No expenses found</h3><p>Try adjusting your filters or add your first expense.</p></div>
      ) : (
        <div className="expenses-table-container">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Date</th><th>Description</th><th>Category</th><th>Vendor</th><th style={{ textAlign: 'right' }}>Amount</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp._id}>
                  <td className="date-cell">{new Date(exp.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="description-cell">{exp.description}</td>
                  <td className="category-cell"><span className={`category-badge ${exp.category}`}>{exp.category}</span></td>
                  <td className="vendor-cell">{exp.vendor || '-'}</td>
                  <td className="amount-cell" style={{ textAlign: 'right' }}>{fmtMAD(exp.amount)}</td>
                  <td className="actions-cell">
                    <button className="edit-btn" onClick={() => handleEdit(exp)} title="Edit">✏️</button>
                    <button className="delete-btn" onClick={() => handleDelete(exp)} title="Delete">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expenses.length > 0 && (<div className="results-summary">Showing {expenses.length} expenses</div>)}
    </div>
  );
};

const ExpenseForm = ({ initial, onCancel, onSaved }) => {
  const [form, setForm] = useState({
    amount: initial?.amount || '',
    description: initial?.description || '',
    category: initial?.category || 'other',
    date: initial ? new Date(initial.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    vendor: initial?.vendor || '',
    notes: initial?.notes || '',
    receiptUrl: initial?.receiptUrl || ''
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.category || !form.date) {
      setErr('Please fill in all required fields');
      return;
    }
    try {
      setLoading(true);
      setErr('');
      if (initial?._id) await expenseService.updateExpense(initial._id, form);
      else await expenseService.createExpense(form);
      await onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>{initial ? 'Edit Expense' : 'Add Expense'}</h3>
          <button onClick={onCancel} className="close-btn" disabled={loading}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="expense-form">
          {err && <div className="form-error">❌ {err}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Amount (MAD) *</label>
              <input type="number" id="amount" name="amount" value={form.amount} onChange={handleChange} min="0" step="0.01" required disabled={loading} />
            </div>
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input type="date" id="date" name="date" value={form.date} onChange={handleChange} required disabled={loading} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <input type="text" id="description" name="description" value={form.description} onChange={handleChange} placeholder="e.g., Lobby cleaning" required disabled={loading} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select id="category" name="category" value={form.category} onChange={handleChange} required disabled={loading}>
                {categories.filter(c => c.value !== 'all').map(c => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="vendor">Vendor</label>
              <input type="text" id="vendor" name="vendor" value={form.vendor} onChange={handleChange} placeholder="Supplier/Company" disabled={loading} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows="3" disabled={loading} />
          </div>

          <div className="form-group">
            <label htmlFor="receiptUrl">Receipt URL (optional)</label>
            <input type="url" id="receiptUrl" name="receiptUrl" value={form.receiptUrl} onChange={handleChange} placeholder="https://..." disabled={loading} />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="cancel-btn" disabled={loading}>Cancel</button>
            <button type="submit" className="confirm-btn" disabled={loading}>{loading ? 'Saving...' : (initial ? 'Update Expense' : 'Create Expense')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Expenses;