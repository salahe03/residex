import React, { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import CreatePayment from './CreatePayment';
import './PaymentManagement.css';

const PaymentManagement = () => {
  const { user, isAdmin } = useAuth();
  const { showSuccess, showWarning } = useToast(); // Changed from showError to showWarning
  
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
  const [showSubmitPayment, setShowSubmitPayment] = useState(false);
  const [showConfirmPayment, setShowConfirmPayment] = useState(false);
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

  // Handle tenant payment submission
  const handleSubmitPayment = async (payment) => {
    setSelectedPayment(payment);
    setShowSubmitPayment(true);
  };

  const handleConfirmSubmitPayment = async (paymentDetails) => {
    try {
      setProcessingPayment(selectedPayment._id);
      await paymentService.submitPayment(selectedPayment._id, paymentDetails);
      
      setShowSubmitPayment(false);
      setSelectedPayment(null);
      loadData(); // Refresh data
      
      // Add success toast for tenant payment submission
      showSuccess(`Payment proof submitted successfully! Your ${selectedPayment.description} payment is now awaiting admin confirmation.`);
      
      console.log('Payment submitted successfully');
    } catch (error) {
      console.error('Error submitting payment:', error);
      setError(error.message);
    } finally {
      setProcessingPayment(null);
    }
  };

  // Handle admin payment confirmation
  const handleConfirmPayment = async (payment) => {
    setSelectedPayment(payment);
    setShowConfirmPayment(true);
  };

  const handleConfirmConfirmPayment = async (adminNotes) => {
    try {
      setProcessingPayment(selectedPayment._id);
      await paymentService.confirmPayment(selectedPayment._id, adminNotes);
      
      setShowConfirmPayment(false);
      setSelectedPayment(null);
      loadData(); // Refresh data
      
      // Add success toast for admin payment confirmation
      showSuccess(`Payment confirmed! ${selectedPayment.amount} MAD collected from ${selectedPayment.resident?.name} for ${selectedPayment.description}.`);
      
      console.log('Payment confirmed successfully');
    } catch (error) {
      console.error('Error confirming payment:', error);
      setError(error.message);
    } finally {
      setProcessingPayment(null);
    }
  };

  // Handle admin payment rejection
  const handleRejectPayment = async (payment) => {
    if (window.confirm('Are you sure you want to reject this payment submission?')) {
      try {
        setProcessingPayment(payment._id);
        await paymentService.rejectPayment(payment._id, 'Payment submission rejected by admin');
        
        loadData(); // Refresh data
        
        // Updated to use warning toast (amber with "!" icon) for payment rejection
        showWarning(`Payment rejected! ${payment.resident?.name}'s payment for ${payment.description} has been declined and can be resubmitted.`);
        
        console.log('Payment rejected successfully');
      } catch (error) {
        console.error('Error rejecting payment:', error);
        setError(error.message);
      } finally {
        setProcessingPayment(null);
      }
    }
  };

  // Handle creating bulk payments (admin only)
  const handleCreateBulkSuccess = () => {
    setShowCreateBulk(false);
    loadData(); // Refresh data
    
    // Add success toast for payment creation
    showSuccess('New payments created successfully! Residents have been notified of their payment obligations.');
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
      case 'submitted':
        return 'status-submitted';
      case 'pending':
        return 'status-pending';
      case 'overdue':
        return 'status-overdue';
      case 'rejected':
        return 'status-rejected';
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
  if (loading && !showCreateBulk && !showSubmitPayment && !showConfirmPayment) {
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
            {isAdmin ? 'Manage all resident payments and charges' : 'View your payment history and submit payment proofs'}
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
            <option value="submitted">Submitted</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="rejected">Rejected</option>
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
                <th>Actions</th>
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
                      {payment.status === 'submitted' ? 'Awaiting Confirmation' : 
                       payment.status === 'rejected' ? 'Rejected' :
                       payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                    {payment.confirmation?.confirmedAt && (
                      <div className="payment-date">Confirmed: {formatDate(payment.confirmation.confirmedAt)}</div>
                    )}
                    {payment.paymentSubmission?.submittedAt && (
                      <div className="payment-date">Submitted: {formatDate(payment.paymentSubmission.submittedAt)}</div>
                    )}
                    {payment.status === 'rejected' && payment.confirmation?.adminNotes && (
                      <div className="rejection-reason">Reason: {payment.confirmation.adminNotes}</div>
                    )}
                  </td>
                  <td className="actions-cell">
                    {/* Tenant Actions */}
                    {!isAdmin && (payment.status === 'pending' || payment.status === 'overdue' || payment.status === 'rejected') && (
                      <button
                        onClick={() => handleSubmitPayment(payment)}
                        className="pay-btn"
                        disabled={processingPayment === payment._id}
                        title="Submit payment proof"
                      >
                        {processingPayment === payment._id ? '⏳' : payment.status === 'rejected' ? '🔄 Resubmit' : '💳 Pay'}
                      </button>
                    )}
                    
                    {/* Admin Actions */}
                    {isAdmin && payment.status === 'submitted' && (
                      <div className="admin-actions">
                        <button
                          onClick={() => handleConfirmPayment(payment)}
                          className="confirm-btn"
                          disabled={processingPayment === payment._id}
                          title="Confirm payment"
                        >
                          {processingPayment === payment._id ? '⏳' : '✅'}
                        </button>
                        <button
                          onClick={() => handleRejectPayment(payment)}
                          className="reject-btn"
                          disabled={processingPayment === payment._id}
                          title="Reject payment"
                        >
                          ❌
                        </button>
                      </div>
                    )}
                  </td>
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

      {/* Submit Payment Modal (Tenant) */}
      {showSubmitPayment && selectedPayment && !isAdmin && (
        <SubmitPaymentModal
          payment={selectedPayment}
          onConfirm={handleConfirmSubmitPayment}
          onCancel={() => {
            setShowSubmitPayment(false);
            setSelectedPayment(null);
          }}
        />
      )}

      {/* Confirm Payment Modal (Admin) */}
      {showConfirmPayment && selectedPayment && isAdmin && (
        <ConfirmPaymentModal
          payment={selectedPayment}
          onConfirm={handleConfirmConfirmPayment}
          onCancel={() => {
            setShowConfirmPayment(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
};

// Submit Payment Modal Component (Tenant)
const SubmitPaymentModal = ({ payment, onConfirm, onCancel }) => {
  const [formData, setFormData] = useState({
    paymentMethod: 'bank_transfer',
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
      console.error('Error submitting payment:', error);
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
          <h3>💳 Submit Payment Proof</h3>
          <button onClick={onCancel} className="close-btn">×</button>
        </div>

        <div className="payment-details">
          <p><strong>Description:</strong> {payment.description}</p>
          <p><strong>Amount Due:</strong> {payment.amount} MAD</p>
          <p><strong>Period:</strong> {payment.period}</p>
          <p><strong>Due Date:</strong> {new Date(payment.dueDate).toLocaleDateString()}</p>
        </div>

        <form onSubmit={handleSubmit} className="submit-payment-form">
          <div className="form-group">
            <label htmlFor="paymentMethod">How did you pay? *</label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="paymentDate">When did you pay? *</label>
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
            <label htmlFor="reference">Reference/Transaction ID</label>
            <input
              type="text"
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="e.g., Transfer reference, Check number..."
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information about this payment..."
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
              {loading ? 'Submitting...' : 'Submit Payment Proof'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Confirm Payment Modal Component (Admin)
const ConfirmPaymentModal = ({ payment, onConfirm, onCancel }) => {
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onConfirm(adminNotes);
    } catch (error) {
      console.error('Error confirming payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>✅ Confirm Payment Receipt</h3>
          <button onClick={onCancel} className="close-btn">×</button>
        </div>

        <div className="payment-details">
          <h4>Payment Submission Details</h4>
          <p><strong>Resident:</strong> {payment.resident?.name}</p>
          <p><strong>Amount:</strong> {payment.amount} MAD</p>
          <p><strong>Period:</strong> {payment.period}</p>
          
          <hr />
          
          <p><strong>Payment Method:</strong> {payment.paymentSubmission?.paymentMethod?.replace('_', ' ')}</p>
          <p><strong>Payment Date:</strong> {new Date(payment.paymentSubmission?.paymentDate).toLocaleDateString()}</p>
          {payment.paymentSubmission?.reference && (
            <p><strong>Reference:</strong> {payment.paymentSubmission.reference}</p>
          )}
          {payment.paymentSubmission?.notes && (
            <p><strong>Tenant Notes:</strong> {payment.paymentSubmission.notes}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="confirm-payment-form">
          <div className="form-group">
            <label htmlFor="adminNotes">Admin Notes (Optional)</label>
            <textarea
              id="adminNotes"
              name="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any notes about this payment confirmation..."
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
              {loading ? 'Confirming...' : 'Confirm Payment Received'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentManagement;