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

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { boxWidth: 12 } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { callback: (v) => `${v} MAD` } }
    }
  };

  if (loading) {
    return (
      <div className="tenant-dashboard">
        <div className="td-header">
          <div className="td-title">
            <h2>🏠 Dashboard</h2>
            <p>Your payments overview</p>
          </div>
        </div>
        <div className="td-loading">Loading your data…</div>
      </div>
    );
  }

  return (
    <div className="tenant-dashboard">
      <div className="td-header">
        <div className="td-title">
          <h2>🏠 Dashboard</h2>
          <p>Your payments overview</p>
        </div>
      </div>

      {error && <div className="td-error">❌ {error}</div>}

      {/* Stat tiles */}
      <div className="td-tiles">
        <div className="td-tile clickable" onClick={() => onNavigate?.('payments')} title="Go to My Payments">
          <span className="td-number">{MAD(totalAssigned)}</span>
          <span className="td-label">Total Assigned</span>
        </div>
        <div className="td-tile clickable" onClick={() => onNavigate?.('payments')} title="Go to My Payments">
          <span className="td-number">{MAD(totalPaid)}</span>
          <span className="td-label">Amount Paid</span>
        </div>
        <div className="td-tile clickable warning" onClick={() => onNavigate?.('payments')} title="Go to My Payments">
          <span className="td-number">{MAD(outstanding)}</span>
          <span className="td-label">Outstanding</span>
        </div>
        <div className="td-tile">
          <span className="td-number">{nextDue ? fmtDate(nextDue) : '-'}</span>
          <span className="td-label">Next Due Date</span>
        </div>
        <div className="td-tile">
          <span className="td-number">{lastPaymentDate ? fmtDate(lastPaymentDate) : '-'}</span>
          <span className="td-label">Last Payment</span>
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