import React, { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import CreatePayment from './CreatePayment'; // Updated import
import './PaymentManagement.css';

const PaymentManagement = () => {
  const { user, isAdmin } = useAuth();
  
  // Shared states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  
  // Payment states
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingPayment, setProcessingPayment] = useState(null);
  
  // Modal states
  const [showCreateBulk, setShowCreateBulk] = useState(false);
  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Load data based on user role
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      if (isAdmin) {
        // Admin sees all payments and stats
        const statsResponse = await paymentService.getPaymentStats();
        setStats(statsResponse.data);
        
        const paymentsResponse = await paymentService.getAllPayments();
        setPayments(paymentsResponse.data || []);
      } else {
        // Regular users see only their own payments
        const userPaymentsResponse = await paymentService.getUserPayments(user.id);
        setPayments(userPaymentsResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle marking payment as paid (admin only)
  const handleMarkPaid = async (payment) => {
    setSelectedPayment(payment);
    setShowMarkPaid(true);
  };

  const handleConfirmMarkPaid = async (paymentDetails) => {
    try {
      setProcessingPayment(selectedPayment._id);
      await paymentService.markPaymentPaid(selectedPayment._id, paymentDetails);
      
      setShowMarkPaid(false);
      setSelectedPayment(null);
      loadData(); // Refresh data
      
      console.log('Payment marked as paid successfully');
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      setError(error.message);
    } finally {
      setProcessingPayment(null);
    }
  };

  // Handle creating bulk payments (admin only)
  const handleCreateBulkSuccess = () => {
    setShowCreateBulk(false);
    loadData(); // Refresh data
  };

  // Filter payments based on search and status
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.resident?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.period?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return 'status-paid';
      case 'pending':
        return 'status-pending';
      case 'overdue':
        return 'status-overdue';
      default:
        return 'status-pending';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `${amount} MAD`;
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading && !showCreateBulk && !showMarkPaid) {
    return (
      <div className="payment-management-container">
        <div className="loading-message">
          <h3>Loading payments...</h3>
          <p>Please wait while we fetch the payment information.</p>
        </div>
      </div>
    );
  }

  // Render create payment modal
  if (showCreateBulk) {
    return (
      <CreatePayment 
        onSuccess={handleCreateBulkSuccess}
        onCancel={() => setShowCreateBulk(false)}
      />
    );
  }

  return (
    <div className="payment-management-container">
      {/* Header with stats */}
      <div className="payment-header">
        <div className="header-title">
          <h2>💰 {isAdmin ? 'Payment Management' : 'My Payments'}</h2>
          <p>
            {isAdmin ? 'Manage all resident payments and charges' : 'View your payment history and status'}
          </p>
        </div>
        
        {/* Admin Stats */}
        {stats && isAdmin && (
          <div className="payment-stats">
            <div className="stat-card">
              <span className="stat-number">{stats.total.count}</span>
              <span className="stat-label">Total Payments</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{formatCurrency(stats.total.paidAmount)}</span>
              <span className="stat-label">Amount Collected</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{formatCurrency(stats.total.totalAmount - stats.total.paidAmount)}</span>
              <span className="stat-label">Outstanding</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{formatCurrency(Math.round(stats.averagePayment))}</span>
              <span className="stat-label">Avg. Payment</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="payment-controls">
        <div className="search-filters">
          <input
            type="text"
            placeholder="🔍 Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        
        {/* Admin Only: Create New Payment Button */}
        {isAdmin && (
          <button onClick={() => setShowCreateBulk(true)} className="create-bulk-btn">
            + New Payment
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="no-payments">
          <h3>No payments found</h3>
          <p>
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters.' 
              : isAdmin 
                ? 'No payments have been created yet. Start by creating bulk payments for residents.'
                : 'No payments have been assigned to you yet.'
            }
          </p>
        </div>
      ) : (
        <div className="payment-table-container">
          <table className="payment-table">
            <thead>
              <tr>
                {/* Admin sees resident column, users don't */}
                {isAdmin && <th>Resident</th>}
                <th>Description</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                {/* Admin sees actions column */}
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment._id}>
                  {/* Admin sees resident info */}
                  {isAdmin && (
                    <td className="resident-cell">
                      <div className="resident-info">
                        <span className="resident-name">{payment.resident?.name}</span>
                        <span className="resident-apartment">{payment.resident?.apartmentNumber}</span>
                      </div>
                    </td>
                  )}
                  <td className="description-cell">{payment.description}</td>
                  <td className="period-cell">{payment.period}</td>
                  <td className="amount-cell">{formatCurrency(payment.amount)}</td>
                  <td className="date-cell">{formatDate(payment.dueDate)}</td>
                  <td className="status-cell">
                    <span className={`status-badge ${getStatusBadge(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                    {payment.paymentDate && (
                      <div className="payment-date">Paid: {formatDate(payment.paymentDate)}</div>
                    )}
                  </td>
                  {/* Admin actions */}
                  {isAdmin && (
                    <td className="actions-cell">
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => handleMarkPaid(payment)}
                          className="mark-paid-btn"
                          disabled={processingPayment === payment._id}
                          title="Mark as paid"
                        >
                          {processingPayment === payment._id ? '⏳' : '✅'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results summary */}
      {filteredPayments.length > 0 && (
        <div className="results-summary">
          Showing {filteredPayments.length} of {payments.length} payments
        </div>
      )}

      {/* Mark as Paid Modal (Admin only) */}
      {showMarkPaid && selectedPayment && isAdmin && (
        <MarkPaidModal
          payment={selectedPayment}
          onConfirm={handleConfirmMarkPaid}
          onCancel={() => {
            setShowMarkPaid(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
};

// Mark as Paid Modal Component (Admin only)
const MarkPaidModal = ({ payment, onConfirm, onCancel }) => {
  const [formData, setFormData] = useState({
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onConfirm(formData);
    } catch (error) {
      console.error('Error confirming payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Mark Payment as Paid</h3>
          <button onClick={onCancel} className="close-btn">×</button>
        </div>

        <div className="payment-details">
          <p><strong>Resident:</strong> {payment.resident?.name}</p>
          <p><strong>Description:</strong> {payment.description}</p>
          <p><strong>Amount:</strong> {payment.amount} MAD</p>
          <p><strong>Period:</strong> {payment.period}</p>
        </div>

        <form onSubmit={handleSubmit} className="mark-paid-form">
          <div className="form-group">
            <label htmlFor="paymentMethod">Payment Method *</label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="paymentDate">Payment Date *</label>
            <input
              type="date"
              id="paymentDate"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reference">Reference (Optional)</label>
            <input
              type="text"
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Transaction ID, Check number, etc."
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about this payment"
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onCancel}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="confirm-btn"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Mark as Paid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentManagement;