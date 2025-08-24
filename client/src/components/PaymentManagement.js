import React, { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import CreatePayment from './CreatePayment';
import SkeletonTable from './ui/SkeletonTable';
import KpiTiles, { KPI_ICONS } from './ui/KpiTiles';
import DropdownMenu from './ui/DropdownMenu';
import { FiChevronDown } from 'react-icons/fi'; // Changed from FiFilter to FiChevronDown
import './ui/KpiTiles.css';
import './PaymentManagement.css';

const PaymentManagement = () => {
  const { user, isAdmin } = useAuth();
  const { showSuccess, showWarning, showError } = useToast();
  
  // Shared states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null); // Admin stats
  const [tenantStats, setTenantStats] = useState(null); // NEW: Tenant stats
  
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

  // Status filter options for dropdown
  const statusFilterOptions = [
    { id: 'all', text: 'All Status', onClick: () => setFilterStatus('all') },
    { id: 'pending', text: 'Pending', onClick: () => setFilterStatus('pending') },
    { id: 'submitted', text: 'Submitted', onClick: () => setFilterStatus('submitted') },
    { id: 'paid', text: 'Paid', onClick: () => setFilterStatus('paid') },
    { id: 'overdue', text: 'Overdue', onClick: () => setFilterStatus('overdue') },
    { id: 'rejected', text: 'Rejected', onClick: () => setFilterStatus('rejected') }
  ];

  // Get current filter display text
  const getStatusFilterText = () => {
    switch (filterStatus) {
      case 'pending': return 'Pending';
      case 'submitted': return 'Submitted';
      case 'paid': return 'Paid';
      case 'overdue': return 'Overdue';
      case 'rejected': return 'Rejected';
      default: return 'All Status';
    }
  };

  // Helper function to calculate tenant stats from payments
  const calculateTenantStats = useCallback((paymentList) => {
    if (!paymentList || paymentList.length === 0) {
      return {
        totalAssigned: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        totalOverdue: 0,
        completionRate: 0,
        nextDueAmount: 0,
        nextDueDate: null
      };
    }

    const now = new Date();
    const totalAssigned = paymentList.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPaid = paymentList.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalOutstanding = paymentList.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalOverdue = paymentList.filter(p => {
      return p.status === 'pending' && new Date(p.dueDate) < now;
    }).reduce((sum, p) => sum + (p.amount || 0), 0);

    const completionRate = totalAssigned > 0 ? Math.round((totalPaid / totalAssigned) * 100) : 0;

    // Find next due payment
    const upcomingPayments = paymentList
      .filter(p => p.status === 'pending' && new Date(p.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    const nextDue = upcomingPayments[0];
    const nextDueAmount = nextDue ? nextDue.amount : 0;
    const nextDueDate = nextDue ? nextDue.dueDate : null;

    return {
      totalAssigned,
      totalPaid,
      totalOutstanding,
      totalOverdue,
      completionRate,
      nextDueAmount,
      nextDueDate
    };
  }, []);

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
        const userPayments = userPaymentsResponse.data || [];
        setPayments(userPayments);
        
        // Calculate tenant stats from their payments
        const calculatedStats = calculateTenantStats(userPayments);
        setTenantStats(calculatedStats);
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdmin, calculateTenantStats]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [loadData, user?.id]);

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `${Number(amount || 0).toLocaleString()} MAD`;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get status badge class
  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'submitted': return 'status-submitted';
      case 'pending': return 'status-pending';
      case 'overdue': return 'status-overdue';
      case 'rejected': return 'status-overdue';
      default: return 'status-pending';
    }
  };

  // Handle tenant payment submission
  const handleSubmitPayment = (payment) => {
    setSelectedPayment(payment);
    setShowSubmitPayment(true);
  };

  const handleConfirmPayment = (payment) => {
    setSelectedPayment(payment);
    setShowConfirmPayment(true);
  };

  const handleConfirmSubmitPayment = async (paymentData) => {
    try {
      setProcessingPayment(selectedPayment._id);
      await paymentService.submitPayment(selectedPayment._id, paymentData);
      setShowSubmitPayment(false);
      setSelectedPayment(null);
      loadData();
      showSuccess('Payment submitted successfully! It will be reviewed and confirmed by an admin.');
    } catch (error) {
      console.error('Error submitting payment:', error);
      setError(error.message);
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleConfirmConfirmPayment = async (confirmationData) => {
    try {
      setProcessingPayment(selectedPayment._id);
      await paymentService.confirmPayment(selectedPayment._id, confirmationData);
      setShowConfirmPayment(false);
      setSelectedPayment(null);
      loadData();
      showSuccess(`Payment confirmed successfully! ${selectedPayment.resident?.name}'s payment has been processed.`);
    } catch (error) {
      console.error('Error confirming payment:', error);
      setError(error.message);
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleRejectPayment = async (payment) => {
    if (window.confirm(`Reject ${payment.resident?.name}'s payment for ${payment.description}?`)) {
      try {
        setProcessingPayment(payment._id);
        await paymentService.rejectPayment(payment._id, {
          adminNotes: 'Payment rejected by admin'
        });
        loadData();
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

  const handleCreateBulkSuccess = () => {
    setShowCreateBulk(false);
    loadData();
    showSuccess('New payments created successfully! Residents have been notified of their payment obligations.');
  };

  // Filter payments based on search and status
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.resident?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.period?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'pending' && payment.status === 'pending') ||
                          (filterStatus === 'submitted' && payment.status === 'submitted') ||
                          (filterStatus === 'paid' && payment.status === 'paid') ||
                          (filterStatus === 'overdue' && payment.status === 'pending' && new Date(payment.dueDate) < new Date()) ||
                          (filterStatus === 'rejected' && payment.status === 'rejected');
    
    return matchesSearch && matchesStatus;
  });

  // Loading state
  if (loading && !showCreateBulk && !showSubmitPayment && !showConfirmPayment) {
    return (
      <div className="universal-page-container page-fade">
        <SkeletonTable rows={8} cols={6} />
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
    <div className="universal-page-container">
      {/* ADMIN STATS - Keep existing */}
      {stats && isAdmin && (
        <KpiTiles
          items={[
            {
              label: 'Total Payments',
              value: (stats.total?.count ?? 0).toLocaleString(),
              color: 'indigo',
              icon: KPI_ICONS.receipt
            },
            {
              label: 'Amount Collected',
              value: formatCurrency(stats.total?.paidAmount ?? 0),
              color: 'green',
              icon: KPI_ICONS.checkCircle
            },
            {
              label: 'Outstanding',
              value: formatCurrency(
                Math.max(0, (stats.total?.totalAmount ?? 0) - (stats.total?.paidAmount ?? 0))
              ),
              color: 'orange',
              icon: KPI_ICONS.alert
            },
            {
              label: 'Avg. Payment',
              value: formatCurrency(Math.round(stats.averagePayment ?? 0)),
              color: 'purple',
              icon: KPI_ICONS.chartUp
            }
          ]}
        />
      )}

      {/* NEW: TENANT STATS */}
      {tenantStats && !isAdmin && (
        <KpiTiles
          items={[
            {
              label: 'Total Assigned',
              value: formatCurrency(tenantStats.totalAssigned),
              color: 'indigo',
              icon: KPI_ICONS.receipt
            },
            {
              label: 'Amount Paid',
              value: formatCurrency(tenantStats.totalPaid),
              color: 'green',
              icon: KPI_ICONS.checkCircle
            },
            {
              label: 'Outstanding',
              value: formatCurrency(tenantStats.totalOutstanding),
              color: 'orange',
              icon: KPI_ICONS.alert
            },
            {
              label: 'Completion Rate',
              value: `${tenantStats.completionRate}%`,
              color: 'purple',
              icon: KPI_ICONS.chartUp
            }
          ]}
        />
      )}

      {/* Second row of tenant stats */}
      {tenantStats && !isAdmin && (tenantStats.totalOverdue > 0 || tenantStats.nextDueAmount > 0) && (
        <KpiTiles
          items={[
            ...(tenantStats.totalOverdue > 0 ? [{
              label: 'Overdue Amount',
              value: formatCurrency(tenantStats.totalOverdue),
              color: 'red',
              icon: KPI_ICONS.alert
            }] : []),
            ...(tenantStats.nextDueAmount > 0 ? [{
              label: 'Next Due Amount',
              value: formatCurrency(tenantStats.nextDueAmount),
              color: 'cyan',
              icon: KPI_ICONS.calendar
            }] : []),
            ...(tenantStats.nextDueDate ? [{
              label: 'Next Due Date',
              value: formatDate(tenantStats.nextDueDate),
              color: 'blue',
              icon: KPI_ICONS.calendar
            }] : [])
          ].filter(Boolean)}
        />
      )}

      {/* Controls */}
      <div className="payment-controls">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <DropdownMenu
            trigger={
              <span className="filter-dropdown-trigger">
                <FiChevronDown />
                {getStatusFilterText()}
              </span>
            }
            options={statusFilterOptions}
            size="md"
            align="left"
            className="filter-dropdown"
          />
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
        <div className="error-message" style={{ display: 'none' }}>
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
                    {!isAdmin && payment.status === 'pending' && (
                      <button
                        onClick={() => handleSubmitPayment(payment)}
                        className="pay-btn"
                        disabled={processingPayment === payment._id}
                        title="Submit payment"
                      >
                        {processingPayment === payment._id ? '⏳' : '💳 Pay'}
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

// Submit Payment Modal Component (Tenant) - Updated with better error handling
const SubmitPaymentModal = ({ payment, onConfirm, onCancel }) => {
  const [formData, setFormData] = useState({
    paymentMethod: 'bank_transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(''); // Local form validation errors only

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); // Clear local errors
    
    // Basic client-side validation
    if (!formData.paymentMethod || !formData.paymentDate) {
      setFormError('Please fill in all required fields.');
      return;
    }
    
    // Validate payment date is not in the future
    const paymentDate = new Date(formData.paymentDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (paymentDate > today) {
      setFormError('Payment date cannot be in the future.');
      return;
    }
    
    setLoading(true);
    
    try {
      await onConfirm(formData);
      // Success is handled by parent component
    } catch (error) {
      // Let parent handle the error with toast
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
    
    // Clear form error when user starts typing
    if (formError) {
      setFormError('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>💳 {payment.status === 'rejected' ? 'Resubmit' : 'Submit'} Payment Proof</h3>
          <button onClick={onCancel} className="close-btn">×</button>
        </div>

        <div className="payment-details">
          <p><strong>Description:</strong> {payment.description}</p>
          <p><strong>Amount Due:</strong> {payment.amount} MAD</p>
          <p><strong>Period:</strong> {payment.period}</p>
          <p><strong>Due Date:</strong> {new Date(payment.dueDate).toLocaleDateString()}</p>
          {payment.status === 'rejected' && (
            <div className="rejection-notice">
              <p><strong>Previous submission was rejected.</strong></p>
              {payment.confirmation?.adminNotes && (
                <p><em>Reason: {payment.confirmation.adminNotes}</em></p>
              )}
            </div>
          )}
        </div>

        {/* Show only local form validation errors */}
        {formError && (
          <div className="form-error">
            {formError}
          </div>
        )}

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
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
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
              {loading ? 'Submitting...' : payment.status === 'rejected' ? 'Resubmit Payment Proof' : 'Submit Payment Proof'}
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