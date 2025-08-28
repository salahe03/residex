import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { expenseService } from '../services/expenseService';
import { useToast } from '../contexts/ToastContext';
import './Expenses.css';
import SkeletonTable from './ui/SkeletonTable'; // add this import
import KpiTiles, { KPI_ICONS } from './ui/KpiTiles';
import './ui/KpiTiles.css';
import { FiSend, FiEdit2, FiTrash2 } from 'react-icons/fi'; // NEW
import { motion, AnimatePresence } from 'framer-motion';

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
const fmtDate = (d) => new Date(d).toISOString().split('T')[0];

const Expenses = () => {
  const { isAdmin } = useAuth();
  const { showWarning } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [showAllocate, setShowAllocate] = useState(false);
  const [allocatingExpense, setAllocatingExpense] = useState(null);

  const year = useMemo(() => parseInt(month.slice(0, 4), 10), [month]);

  const loadData = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      setError('');
      setExpenses([]);
      setStats(null);
      setOverview(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [list, s, ov] = await Promise.all([
        expenseService.getExpenses({ month, category, q: searchTerm }),
        expenseService.getStats(year),
        expenseService.getFinanceOverview() // CHANGED: overall (not month-scoped)
      ]);
      setExpenses(list.data || []);
      setStats(s.data);
      setOverview(ov.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, month, category, searchTerm, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const topCategory = useMemo(() => {
    if (!stats?.categoryTotals) return '-';
    const entries = Object.entries(stats.categoryTotals);
    if (entries.length === 0) return '-';
    entries.sort((a, b) => b[1] - a[1]);
    return `${entries[0][0]} (${fmtMAD(entries[0][1])})`;
  }, [stats]);

  const shownTotal = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [expenses]
  );

  // CSV export including allocation columns
  const exportCsv = useCallback(() => {
    const headers = [
      'Date','Description','Category','Vendor','Amount (MAD)',
      'Allocated (MAD)','Remaining (MAD)','Status','Notes','Receipt URL','Created By'
    ];
    const escape = (val) => {
      const v = val == null ? '' : String(val);
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    };
    const rows = expenses.map(e => {
      const allocated = typeof e.allocatedTotal === 'number'
        ? e.allocatedTotal
        : (e.allocations || []).reduce((s,a)=>s + (a.amount||0), 0);
      const remaining = Math.max(0, Number(e.amount||0) - allocated);
      const status = allocated <= 0 ? 'unpaid' : (allocated < Number(e.amount||0) ? 'partially_paid' : 'paid');
      return [
        fmtDate(e.date),
        e.description || '',
        e.category || '',
        e.vendor || '',
        Number(e.amount || 0).toFixed(2),
        allocated.toFixed(2),
        remaining.toFixed(2),
        status,
        e.notes || '',
        e.receiptUrl || '',
        e.createdBy ? `${e.createdBy.name} <${e.createdBy.email}>` : ''
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeMonth = typeof month === 'string' ? month : new Date().toISOString().slice(0,7);
    const safeCat = category || 'all';
    a.href = url;
    a.download = `expenses_${safeMonth}_${safeCat}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [expenses, month, category]);

  const handleCreate = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (exp) => { setEditing(exp); setShowForm(true); };
  const handleDelete = async (exp) => {
    if (!window.confirm(`Delete expense "${exp.description}"? This cannot be undone.`)) return;
    try { 
      setLoading(true); 
      await expenseService.deleteExpense(exp._id); 
      
      // Add amber warning toast for deletion
      showWarning(`Expense "${exp.description}" has been deleted.`);
      
      await loadData(); 
    }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const openAllocate = (exp) => {
    setAllocatingExpense(exp);
    setShowAllocate(true);
  };

  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    };
    if (catDropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [catDropdownOpen]);

  if (!isAdmin) {
    return <div className="expenses-container"><div className="error-message">Unauthorized</div></div>;
  }

  if (loading && !showForm && !showAllocate) {
    return (
      <div className="universal-page-container page-fade">
        <SkeletonTable rows={8} cols={7} />
      </div>
    );
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

  if (showAllocate && allocatingExpense) {
    return (
      <AllocateModal
        expense={allocatingExpense}
        overview={overview}
        onCancel={() => { setShowAllocate(false); setAllocatingExpense(null); }}
        onSaved={async () => { setShowAllocate(false); setAllocatingExpense(null); await loadData(); }}
      />
    );
  }

  return (
    <div className="universal-page-container">
      <UiTooltipLayer />
      {/* Stats */}
      <KpiTiles
        items={[
          { label: 'This Month',     value: fmtMAD(stats?.currentMonthTotal || 0), color: 'blue',   icon: KPI_ICONS.banknote },
          { label: 'Year To Date',   value: fmtMAD(stats?.grandTotal || 0),        color: 'indigo', icon: KPI_ICONS.chartUp },
          { label: 'Top Category',   value: topCategory || '-',                     color: 'purple', icon: KPI_ICONS.tag },
        ]}
      />

      {/* Finance overview group */}
      <KpiTiles
        items={[
          { label: 'Collected (All‑Time)', value: fmtMAD(overview?.paidRevenue || 0),         color: 'green',  icon: KPI_ICONS.checkCircle },
          { label: 'Allocated (All‑Time)', value: fmtMAD(overview?.allocatedToExpenses || 0), color: 'cyan',   icon: KPI_ICONS.wallet },
          { label: 'Fund Balance',         value: fmtMAD(overview?.fundBalance || 0),         color: 'teal',   icon: KPI_ICONS.banknote },
          { label: 'Outstanding (All‑Time)', value: fmtMAD(overview?.outstandingExpenses || 0), color: 'orange', icon: KPI_ICONS.alert },
        ]}
      />

      <div className="expenses-controls">
        <div className="search-filters">
          <input type="text" placeholder="🔍 Search description or vendor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="filter-select" />
          <div className="framer-dropdown" ref={catDropdownRef}>
            <button
              type="button"
              className="filter-select"
              onClick={() => setCatDropdownOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 160 }}
            >
              {categories.find(c => c.value === category)?.label || 'All Categories'}
              <svg width="18" height="18" style={{ marginLeft: 8, opacity: 0.7 }} viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="#667eea" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
            </button>
            <AnimatePresence>
              {catDropdownOpen && (
                <motion.ul
                  className="framer-dropdown-list"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: 'absolute',
                    zIndex: 20,
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(102,126,234,0.10)',
                    marginTop: 6,
                    minWidth: 180,
                    padding: 0,
                    listStyle: 'none'
                  }}
                >
                  {categories.filter(c => c.value !== 'all').map(c => (
                    <li key={c.value}>
                      <button
                        type="button"
                        className="framer-dropdown-item"
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 18px',
                          background: 'none',
                          border: 'none',
                          fontSize: 15,
                          color: c.value === category ? '#4f46e5' : '#333',
                          fontWeight: c.value === category ? 700 : 500,
                          cursor: 'pointer',
                          borderRadius: 8,
                          transition: 'background 0.15s'
                        }}
                        onClick={() => { setCategory(c.value); setCatDropdownOpen(false); }}
                      >
                        {c.label}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="controls-right">
          <button onClick={exportCsv} className="export-btn" title="Export current list to CSV">Export CSV</button>
          <button onClick={handleCreate} className="add-expense-btn">+ Add Expense</button>
        </div>
      </div>

      {error && <div className="error-message">❌ {error}</div>}

      {expenses.length === 0 ? (
        <div className="no-expenses"><h3>No expenses found</h3><p>Try adjusting your filters or add your first expense.</p></div>
      ) : (
        <div className="expenses-table-container">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Vendor</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Allocated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => {
                const allocated = typeof exp.allocatedTotal === 'number'
                  ? exp.allocatedTotal
                  : (exp.allocations || []).reduce((s,a)=>s + (a.amount||0), 0);
                const remaining = Math.max(0, Number(exp.amount||0) - allocated);
                const status = allocated <= 0 ? 'unpaid' : (allocated < Number(exp.amount||0) ? 'partially_paid' : 'paid');
                return (
                  <tr key={exp._id}>
                    <td className="date-cell">{new Date(exp.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td className="description-cell">{exp.description}</td>
                    <td className="category-cell"><span className={`category-badge ${exp.category}`}>{exp.category}</span></td>
                    <td className="vendor-cell">{exp.vendor || '-'}</td>
                    <td className="amount-cell" style={{ textAlign: 'right' }}>{fmtMAD(exp.amount)}</td>
                    <td className="allocated-cell" style={{ textAlign: 'right' }}>
                      <div className={`alloc-badge ${status}`}>
                        {fmtMAD(allocated)} / {fmtMAD(exp.amount)}
                      </div>
                      {remaining > 0 && (
                        <div className="alloc-progress">
                          <div className="alloc-progress-bar" style={{ width: `${Math.min(100, (allocated / (exp.amount || 1)) * 100)}%` }}></div>
                        </div>
                      )}
                    </td>
                    <td className="actions-cell">
                      <div className="icon-actions">
                        {remaining > 0 && (
                          <button
                            className="icon-btn allocate-btn"
                            onClick={() => openAllocate(exp)}
                            title="Allocate"
                            aria-label="Allocate"
                            data-tip="Allocate funds"
                          >
                            <FiSend size={16} strokeWidth={2} aria-hidden />
                          </button>
                        )}
                        <button
                          className="icon-btn edit-btn"
                          onClick={() => handleEdit(exp)}
                          title="Edit"
                          aria-label="Edit"
                          data-tip="Edit expense"
                        >
                          <FiEdit2 size={16} strokeWidth={2} aria-hidden />
                        </button>
                        <button
                          className="icon-btn danger delete-btn"
                          onClick={() => handleDelete(exp)}
                          title="Delete"
                          aria-label="Delete"
                          data-tip="Delete expense"
                        >
                          <FiTrash2 size={16} strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {expenses.length > 0 && (
        <div className="results-summary">
          Showing {expenses.length} expenses • Total: {fmtMAD(shownTotal)}
        </div>
      )}
    </div>
  );
};

const ExpenseForm = ({ initial, onCancel, onSaved }) => {
  const { showSuccess } = useToast(); // Add toast hook
  
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
      
      if (initial?._id) {
        await expenseService.updateExpense(initial._id, form);
        // Add green success toast for update
        showSuccess(`Expense "${form.description}" updated successfully!`);
      } else {
        await expenseService.createExpense(form);
        // Add green success toast for creation
        showSuccess(`New expense "${form.description}" created successfully!`);
      }
      
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

const AllocateModal = ({ expense, overview, onCancel, onSaved }) => {
  const { showSuccess } = useToast();
  const allocated = (expense.allocations || []).reduce((s,a)=>s + (a.amount||0), 0);
  const remainingForExpense = Math.max(0, Number(expense.amount||0) - allocated);
  const fundBalance = Number(overview?.fundBalance || 0);
  const maxAlloc = Math.min(remainingForExpense, fundBalance);

  const [form, setForm] = useState({
    amount: maxAlloc ? maxAlloc.toFixed(2) : '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { setErr('Enter a valid amount'); return; }
    if (amt > maxAlloc) { setErr(`Max allocatable is ${maxAlloc.toFixed(2)} MAD`); return; }

    try {
      setLoading(true);
      setErr('');
      await expenseService.allocateExpense(expense._id, { amount: amt, note: form.note });
      showSuccess(`Successfully allocated ${amt.toFixed(2)} MAD to "${expense.description}"`);
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
          <h3>💸 Allocate Funds</h3>
          <button onClick={onCancel} className="close-btn" disabled={loading}>×</button>
        </div>

        <div className="payment-details">
          <p><strong>Expense:</strong> {expense.description}</p>
          <p><strong>Total:</strong> {fmtMAD(expense.amount)} • <strong>Allocated:</strong> {fmtMAD(allocated)} • <strong>Remaining:</strong> {fmtMAD(remainingForExpense)}</p>
          <p><strong>Fund Balance:</strong> {fmtMAD(fundBalance)}</p>
        </div>

        <form onSubmit={handleSubmit} className="expense-form">
          {err && <div className="form-error">❌ {err}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Amount to allocate (MAD) *</label>
              <input type="number" id="amount" name="amount" value={form.amount} onChange={handleChange} min="0" step="0.01" max={maxAlloc || undefined} required disabled={loading || maxAlloc === 0} />
            </div>
            <div className="form-group">
              <label htmlFor="note">Note</label>
              <input type="text" id="note" name="note" value={form.note} onChange={handleChange} placeholder="Optional note" disabled={loading} />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="cancel-btn" disabled={loading}>Cancel</button>
            <button type="submit" className="confirm-btn" disabled={loading || maxAlloc === 0}>{loading ? 'Allocating...' : 'Allocate'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Tooltip Layer (copy from ResidentManagement.js) ---
const UiTooltipLayer = () => {
  const elRef = useRef(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'ui-tooltip';
    const inner = document.createElement('div');
    inner.className = 'ui-tooltip-inner';
    el.appendChild(inner);
    document.body.appendChild(el);
    elRef.current = el;

    let activeTarget = null;

    const positionToTarget = (target) => {
      if (!elRef.current || !target) return;
      const r = target.getBoundingClientRect();
      const x = r.left + r.width / 2 + window.scrollX;
      const y = r.top + window.scrollY;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    };

    const show = (target) => {
      activeTarget = target;
      inner.textContent = target.getAttribute('data-tip') || '';
      positionToTarget(target);
      requestAnimationFrame(() => el.classList.add('visible'));
    };

    const hide = () => {
      activeTarget = null;
      el.classList.remove('visible');
    };

    const onMouseOver = (e) => {
      const target = e.target.closest('.icon-btn[data-tip]');
      if (!target) return;
      show(target);
    };
    const onMouseOut = (e) => {
      if (activeTarget && !e.relatedTarget?.closest('.icon-btn[data-tip]')) {
        hide();
      }
    };
    const onMouseMove = () => {
      if (activeTarget) positionToTarget(activeTarget);
    };
    const onScrollOrResize = () => {
      if (activeTarget) positionToTarget(activeTarget);
    };

    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mouseout', onMouseOut, true);
    document.addEventListener('mousemove', onMouseMove, true);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      document.removeEventListener('mouseover', onMouseOver, true);
      document.removeEventListener('mouseout', onMouseOut, true);
      document.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      if (elRef.current && elRef.current.parentNode) {
        elRef.current.parentNode.removeChild(elRef.current);
      }
    };
  }, []);

  return null;
};

export default Expenses;