import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { paymentService } from '../services/paymentService';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import './TenantDashboard.css';
import PageLoader from './ui/PageLoader';          // add

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const TenantDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');

  // Fetch tenant's payments
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await paymentService.getUserPayments(user.id);
        setPayments(res.data || res || []); // support either {data} or raw array
      } catch (e) {
        setError(e.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) load();
  }, [user?.id]);

  // Helpers
  const MAD = (n) => `${Number(n || 0).toFixed(2)} MAD`;
  const fmtDate = (d) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return '-'; }
  };

  // Compute stats
  const {
    totalAssigned,
    totalPaid,
    outstanding,
    nextDue,
    lastPaymentDate,
    recentPayments
  } = useMemo(() => {
    const total = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const paid = payments
      .filter(p => p.status === 'paid')
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const out = Math.max(0, total - paid);

    // Next due: pick earliest upcoming or overdue that is not paid
    const unpaid = payments.filter(p => p.status !== 'paid');
    const next = unpaid
      .map(p => p.dueDate ? new Date(p.dueDate) : null)
      .filter(Boolean)
      .sort((a, b) => a - b)[0] || null;

    // Last payment date: prefer an explicit paidAt; fallback to updatedAt/createdAt
    const paidDates = payments
      .filter(p => p.status === 'paid')
      .map(p => p.paidAt || p.updatedAt || p.createdAt)
      .filter(Boolean)
      .map(d => new Date(d));
    const lastPaid = paidDates.length ? paidDates.sort((a, b) => b - a)[0] : null;

    // Recent payments for table
    const recent = [...payments]
      .sort((a, b) => new Date(b.createdAt || b.dueDate || 0) - new Date(a.createdAt || a.dueDate || 0))
      .slice(0, 6);

    return {
      totalAssigned: total,
      totalPaid: paid,
      outstanding: out,
      nextDue: next,
      lastPaymentDate: lastPaid,
      recentPayments: recent
    };
  }, [payments]);

  // Build last 6 months labels and series
  const monthLabels = useMemo(() => {
    const labels = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString('en-US', { month: 'short', year: 'numeric' }));
    }
    return labels;
  }, []);

  const series = useMemo(() => {
    // Map label to totals
    const map = monthLabels.reduce((acc, label) => { acc[label] = { assigned: 0, paid: 0 }; return acc; }, {});

    payments.forEach(p => {
      const d = p.dueDate ? new Date(p.dueDate) : (p.createdAt ? new Date(p.createdAt) : null);
      if (!d) return;
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!map[label]) return;
      map[label].assigned += Number(p.amount || 0);
      if (p.status === 'paid') {
        map[label].paid += Number(p.amount || 0);
      }
    });

    const assigned = monthLabels.map(l => map[l].assigned);
    const paid = monthLabels.map(l => map[l].paid);
    const remaining = assigned.map((a, idx) => Math.max(0, a - paid[idx]));

    return { assigned, paid, remaining };
  }, [payments, monthLabels]);

  const lineData = useMemo(() => ({
    labels: monthLabels,
    datasets: [
      {
        label: 'Paid',
        data: series.paid,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: 'Outstanding',
        data: series.remaining,
        borderColor: '#f57c00',
        backgroundColor: 'rgba(245, 124, 0, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      }
    ]
  }), [monthLabels, series]);

  const barData = useMemo(() => ({
    labels: monthLabels,
    datasets: [
      {
        label: 'Assigned',
        data: series.assigned,
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderRadius: 6,
        maxBarThickness: 28,
      }
    ]
  }), [monthLabels, series]);

  // Number formatter
  const fmtNum = (v) => {
    const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
    return Number.isFinite(n) ? n.toLocaleString() : String(v);
  };

  // Create or get a tooltip element per-chart (attached to <body> to avoid clipping)
  const getOrCreateTooltip = (chart) => {
    if (chart.$externalTooltipEl) return chart.$externalTooltipEl;
    const el = document.createElement('div');
    el.className = 'chartjs-tooltip';
    const inner = document.createElement('div');
    inner.className = 'chartjs-tooltip-inner';
    el.appendChild(inner);
    document.body.appendChild(el); // attach to body
    chart.$externalTooltipEl = el;
    return el;
  };

  // External HTML tooltip
  const externalTooltip = (ctx) => {
    const { chart, tooltip } = ctx;
    const el = getOrCreateTooltip(chart);

    // Hide
    if (!tooltip || tooltip.opacity === 0) {
      el.classList.remove('visible');
      el.style.opacity = 0;
      return;
    }

    // Content
    const title = (tooltip.title && tooltip.title.length) ? tooltip.title[0] : '';
    const items = tooltip.dataPoints || [];
    const rows = items.map((i) => {
      const color = i.dataset?.borderColor || i.dataset?.backgroundColor || '#64748b';
      const label = i.dataset?.label ? `${i.dataset.label}: ` : '';
      const value = fmtNum(i.formattedValue ?? i.parsed?.y ?? i.raw ?? '');
      const c = Array.isArray(color) ? color[0] : color;
      return `<div class="row">
        <span class="dot" style="--c:${c}"></span>
        <span class="text">${label}${value}</span>
      </div>`;
    }).join('');

    el.querySelector('.chartjs-tooltip-inner').innerHTML = `
      <div class="title">${title}</div>
      ${rows}
    `;

    // Position relative to viewport, since tooltip is in <body>
    const rect = chart.canvas.getBoundingClientRect();
    const left = rect.left + window.scrollX + tooltip.caretX;
    const top = rect.top + window.scrollY + tooltip.caretY;

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    // Don't set transform here; CSS will handle translate/animation
    el.style.opacity = 1;
    el.classList.add('visible');
  };

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, labels: { boxWidth: 12, padding: 12 } },
      tooltip: { enabled: false, external: externalTooltip }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
      y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { callback: (v) => `${Number(v).toLocaleString()}` } }
    }
  };

  if (loading) {
    return (
      <PageLoader
        title="Loading Dashboard…"
        subtitle="Fetching your latest payments and charts"
      />
    );
  }

  return (
    <div className="universal-page-container">
      {error && <div className="td-error">❌ {error}</div>}

      {/* Stat tiles */}
      <div className="td-tiles">
        {/* Total Assigned */}
        <div className="td-tile clickable" onClick={() => onNavigate?.('payments')} title="Go to My Payments">
          <div className="td-tile-head">
            <div className="td-tile-icon" aria-hidden>
              {/* Banknote (outlined, clean) */}
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2.25" />
                <path d="M6 12h.01M18 12h.01" />
              </svg>
            </div>
            <div className="td-metric">
              <span className="td-number">{MAD(totalAssigned)}</span>
              <span className="td-label">Total Assigned</span>
            </div>
          </div>
        </div>

        {/* Amount Paid */}
        <div className="td-tile clickable" onClick={() => onNavigate?.('payments')} title="Go to My Payments">
          <div className="td-tile-head">
            <div className="td-tile-icon" aria-hidden>
              {/* Check Circle (outlined) */}
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="td-metric">
              <span className="td-number">{MAD(totalPaid)}</span>
              <span className="td-label">Amount Paid</span>
            </div>
          </div>
        </div>

        {/* Outstanding */}
        <div className="td-tile clickable warning" onClick={() => onNavigate?.('payments')} title="Go to My Payments">
          <div className="td-tile-head">
            <div className="td-tile-icon" aria-hidden>
              {/* Alert Circle (outlined) */}
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v5" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <div className="td-metric">
              <span className="td-number">{MAD(outstanding)}</span>
              <span className="td-label">Outstanding</span>
            </div>
          </div>
        </div>

        {/* Next Due Date */}
        <div className="td-tile">
          <div className="td-tile-head">
            <div className="td-tile-icon" aria-hidden>
              {/* Calendar (outlined) */}
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <div className="td-metric">
              <span className="td-number">{nextDue ? fmtDate(nextDue) : '-'}</span>
              <span className="td-label">Next Due Date</span>
            </div>
          </div>
        </div>

        {/* Last Payment */}
        <div className="td-tile">
          <div className="td-tile-head">
            <div className="td-tile-icon" aria-hidden>
              {/* Clock (outlined) */}
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>
            <div className="td-metric">
              <span className="td-number">{lastPaymentDate ? fmtDate(lastPaymentDate) : '-'}</span>
              <span className="td-label">Last Payment</span>
            </div>
          </div>
        </div>
      </div>
 
      {/* Charts */}
      <div className="td-charts">
         <div className="td-card hoverable">
           <div className="td-card-header">
             <h3>Paid vs Outstanding (last 6 months)</h3>
           </div>
           <div className="td-chart">
             <Line data={lineData} options={baseOptions} />
           </div>
         </div>

         <div className="td-card hoverable">
           <div className="td-card-header">
             <h3>Assigned per Month</h3>
           </div>
           <div className="td-chart">
             <Bar data={barData} options={baseOptions} />
           </div>
         </div>
      </div>
 
      {/* Latest payments table */}
      <div className="td-card hoverable">
         <div className="td-card-header">
           <h3>Latest Payments</h3>
           <button className="td-link" onClick={() => onNavigate?.('payments')}>View all →</button>
         </div>
         <div className="td-table-wrap">
           <table className="td-table">
             <thead>
               <tr>
                 <th>Description</th>
                 <th>Period</th>
                 <th>Amount</th>
                 <th>Due Date</th>
                 <th>Status</th>
               </tr>
             </thead>
             <tbody>
               {recentPayments.length === 0 ? (
                 <tr><td colSpan="5" style={{ textAlign: 'center', color: '#666' }}>No payments yet</td></tr>
               ) : recentPayments.map((p) => (
                 <tr key={p._id}>
                   <td className="td-desc">{p.description || '-'}</td>
                   <td>{p.period || '-'}</td>
                   <td className="td-amount">{MAD(p.amount)}</td>
                   <td>{fmtDate(p.dueDate)}</td>
                   <td>
                     <span className={`td-status ${p.status || 'pending'}`}>{p.status || 'pending'}</span>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </div>
    </div>
   );
};

export default TenantDashboard;