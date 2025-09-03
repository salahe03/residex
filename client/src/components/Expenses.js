import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { expenseService } from '../services/expenseService';
import { useToast } from '../contexts/ToastContext';
import './Expenses.css';
import SkeletonTable from './ui/SkeletonTable';
import KpiTiles, { KPI_ICONS } from './ui/KpiTiles';
import './ui/KpiTiles.css';
import { FiSend, FiEdit2, FiTrash2, FiCalendar } from 'react-icons/fi';
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

// Modern Month Picker Component
const MonthPicker = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [yearDirection, setYearDirection] = useState(0); // -1 for prev, 1 for next
  const dropdownRef = useRef();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleMonthSelect = (monthIndex) => {
    const yearMonth = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    onChange(yearMonth);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (!value) return 'Select month';
    const [year, month] = value.split('-');
    const monthName = months[parseInt(month) - 1];
    return `${monthName} ${year}`;
  };

  // Animation variants for year/month grid
  const yearVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 40 : -40,
      opacity: 0,
      position: 'absolute'
    }),
    center: { x: 0, opacity: 1, position: 'static' },
    exit: (direction) => ({
      x: direction > 0 ? -40 : 40,
      opacity: 0,
      position: 'absolute'
    })
  };

  return (
    <div
      className={`month-picker-container ${className}`}
      ref={dropdownRef}
      style={{ position: 'relative', minWidth: 200 }}
    >
      <button
        type="button"
        className="month-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '12px 16px',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          background: '#fff',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.borderColor = '#667eea'}
        onMouseLeave={(e) => e.target.style.borderColor = '#e2e8f0'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiCalendar size={16} style={{ color: '#667eea' }} />
          {getDisplayValue()}
        </div>
        <svg
          width="16"
          height="16"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            opacity: 0.7
          }}
          viewBox="0 0 20 20"
        >
          <path d="M6 8l4 4 4-4" stroke="#667eea" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              zIndex: 50,
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            {/* Year selector with animation */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              position: 'relative',
              height: 40,
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 40 }}>
                <button
                  type="button"
                  onClick={() => { setYearDirection(-1); setCurrentYear(y => y - 1); }}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#667eea'
                  }}
                >
                  ←
                </button>
                <AnimatePresence custom={yearDirection} initial={false} mode="wait">
                  <motion.span
                    key={currentYear}
                    custom={yearDirection}
                    variants={yearVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={{ fontWeight: '600', color: '#374151', minWidth: 60, textAlign: 'center', display: 'inline-block' }}
                  >
                    {currentYear}
                  </motion.span>
                </AnimatePresence>
                <button
                  type="button"
                  onClick={() => { setYearDirection(1); setCurrentYear(y => y + 1); }}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#667eea'
                  }}
                >
                  →
                </button>
              </div>
            </div>

            {/* Month grid with fade/slide animation */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentYear}
                initial={{ opacity: 0, x: yearDirection > 0 ? 40 : -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: yearDirection > 0 ? -40 : 40 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '4px',
                  padding: '16px'
                }}
              >
                {months.map((month, index) => {
                  const isSelected = value === `${currentYear}-${String(index + 1).padStart(2, '0')}`;
                  return (
                    <motion.button
                      key={month}
                      type="button"
                      onClick={() => handleMonthSelect(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: 'none',
                        background: isSelected ? '#667eea' : 'transparent',
                        color: isSelected ? '#fff' : '#374151',
                        fontSize: '14px',
                        fontWeight: isSelected ? '600' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {month.slice(0, 3)}
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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

  // Simple month state - format: "YYYY-MM"
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(currentMonth);

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
        expenseService.getFinanceOverview()
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
      'Date', 'Description', 'Category', 'Vendor', 'Amount (MAD)',
      'Allocated (MAD)', 'Remaining (MAD)', 'Status', 'Notes', 'Receipt URL', 'Created By'
    ];
    const escape = (val) => {
      const v = val == null ? '' : String(val);
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    };
    const rows = expenses.map(e => {
      const allocated = typeof e.allocatedTotal === 'number'
        ? e.allocatedTotal
        : (e.allocations || []).reduce((s, a) => s + (a.amount || 0), 0);
      const remaining = Math.max(0, Number(e.amount || 0) - allocated);
      const status = allocated <= 0 ? 'unpaid' : (allocated < Number(e.amount || 0) ? 'partially_paid' : 'paid');
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
    const safeMonth = typeof month === 'string' ? month : new Date().toISOString().slice(0, 7);
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

  { error && <div className="error-message">❌ {error}</div> }

  {
    loading ? (
      <div className="expenses-table-container">
        <SkeletonTable rows={8} cols={7} />
      </div>
    ) : expenses.length === 0 ? (
      <div className="no-expenses"><h3>No expenses found</h3><p>Try adjusting your filters or add your first expense.</p></div>
    ) : (
      <div className="expenses-table-container">
        {/* ...your table as before... */}
      </div>
    )
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
           // Use the computed total of the currently loaded month
          { label: 'This Month', value: fmtMAD(shownTotal), color: 'blue', icon: KPI_ICONS.banknote },
          { label: 'Year To Date', value: fmtMAD(stats?.grandTotal || 0), color: 'indigo', icon: KPI_ICONS.chartUp },
          { label: 'Top Category', value: topCategory || '-', color: 'purple', icon: KPI_ICONS.tag },
        ]}
      />

      {/* Finance overview group */}
      <KpiTiles
        items={[
          { label: 'Collected (All‑Time)', value: fmtMAD(overview?.paidRevenue || 0), color: 'green', icon: KPI_ICONS.checkCircle },
          { label: 'Allocated (All‑Time)', value: fmtMAD(overview?.allocatedToExpenses || 0), color: 'cyan', icon: KPI_ICONS.wallet },
          { label: 'Fund Balance', value: fmtMAD(overview?.fundBalance || 0), color: 'teal', icon: KPI_ICONS.banknote },
          { label: 'Outstanding (All‑Time)', value: fmtMAD(overview?.outstandingExpenses || 0), color: 'orange', icon: KPI_ICONS.alert },
        ]}
      />

      <div className="expenses-controls">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search description or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <MonthPicker
            value={month}
            onChange={setMonth}
          />

          <div className="framer-dropdown" ref={catDropdownRef}>
            <button
              type="button"
              className="filter-select"
              onClick={() => setCatDropdownOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 160 }}
            >
              {categories.find(c => c.value === category)?.label || 'All Categories'}
              <svg width="18" height="18" style={{ marginLeft: 8, opacity: 0.7 }} viewBox="0 0 20 20">
                <path d="M6 8l4 4 4-4" stroke="#667eea" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            <AnimatePresence mode="wait">
              {catDropdownOpen && (
                <motion.ul
                  key="dropdown-menu"
                  className="dropdown-menu left"
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
                      <motion.button
                        type="button"
                        className={`dropdown-option${c.value === category ? ' selected' : ''}`}
                        onClick={() => { setCategory(c.value); setCatDropdownOpen(false); }}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="dropdown-option-text">{c.label}</span>
                      </motion.button>
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
                  : (exp.allocations || []).reduce((s, a) => s + (a.amount || 0), 0);
                const remaining = Math.max(0, Number(exp.amount || 0) - allocated);
                const status = allocated <= 0 ? 'unpaid' : (allocated < Number(exp.amount || 0) ? 'partially_paid' : 'paid');
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
  const { showSuccess } = useToast();

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
        showSuccess(`Expense "${form.description}" updated successfully!`);
      } else {
        await expenseService.createExpense(form);
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
  const allocated = (expense.allocations || []).reduce((s, a) => s + (a.amount || 0), 0);
  const remainingForExpense = Math.max(0, Number(expense.amount || 0) - allocated);
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