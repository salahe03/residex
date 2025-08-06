import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/paymentService';
import { userService } from '../services/userService';
import './PaymentModals.css';

const CreatePayment = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    period: '',
    dueDate: '',
    type: 'monthly_charge',
    paymentScope: 'bulk', // NEW: 'bulk' or 'individual'
    selectedResident: '' // NEW: for individual payments
  });
  const [allResidents, setAllResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResidents = async () => {
      try {
        const response = await userService.getAllUsers();
        const activeResidents = response.data?.filter(user => 
          user.role !== 'admin' && user.isActive
        ) || [];
        setAllResidents(activeResidents);
      } catch (error) {
        console.error('Error loading residents:', error);
        setError('Failed to load residents');
      }
    };

    loadResidents();
  }, []);

  // Calculate affected residents based on scope
  const getAffectedResidents = () => {
    if (formData.paymentScope === 'bulk') {
      return allResidents;
    } else if (formData.paymentScope === 'individual' && formData.selectedResident) {
      return allResidents.filter(resident => resident._id === formData.selectedResident);
    }
    return [];
  };

  const affectedResidents = getAffectedResidents();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.period || !formData.dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.paymentScope === 'individual' && !formData.selectedResident) {
      setError('Please select a resident for individual payment');
      return;
    }

    if (affectedResidents.length === 0) {
      setError('No residents found to create payments for');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const paymentData = {
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        period: formData.period.trim(),
        dueDate: formData.dueDate,
        type: formData.type,
        // NEW: Send specific residents for individual payments
        ...(formData.paymentScope === 'individual' && {
          targetResidents: [formData.selectedResident]
        })
      };

      console.log('Creating payment for', affectedResidents.length, 'resident(s)');
      
      const response = await paymentService.createBulkPayments(paymentData);
      
      console.log('Payment created successfully:', response.data);
      onSuccess();
      
    } catch (error) {
      console.error('Error creating payment:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate default period (current month/year)
  const getCurrentPeriod = () => {
    const now = new Date();
    const month = now.toLocaleDateString('en-US', { month: 'long' });
    const year = now.getFullYear();
    return `${month} ${year}`;
  };

  // Generate default due date (end of current month)
  const getDefaultDueDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return nextMonth.toISOString().split('T')[0];
  };

  // Set defaults when component mounts
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      period: getCurrentPeriod(),
      dueDate: getDefaultDueDate()
    }));
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>💰 Create New Payment</h2>
          <button onClick={onCancel} className="close-btn" disabled={loading}>
            ×
          </button>
        </div>

        <div className="bulk-payment-info">
          <div className="info-card">
            <h3>📊 Payment Summary</h3>
            <p><strong>Payment Scope:</strong> {formData.paymentScope === 'bulk' ? 'All Active Residents' : 'Individual Resident'}</p>
            <p><strong>Affected Residents:</strong> {affectedResidents.length}</p>
            <p><strong>Total Amount:</strong> {formData.amount ? `${parseFloat(formData.amount) * affectedResidents.length} MAD` : '0 MAD'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bulk-payment-form">
          {error && (
            <div className="form-error">
              ❌ {error}
            </div>
          )}

          {/* NEW: Payment Scope Selection */}
          <div className="form-group scope-selection">
            <label>Payment Scope *</label>
            <div className="scope-options">
              <label className="scope-option">
                <input
                  type="radio"
                  name="paymentScope"
                  value="bulk"
                  checked={formData.paymentScope === 'bulk'}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="scope-label">
                  <strong>📢 Bulk Payment</strong>
                  <small>Create payment for all active residents</small>
                </span>
              </label>
              
              <label className="scope-option">
                <input
                  type="radio"
                  name="paymentScope"
                  value="individual"
                  checked={formData.paymentScope === 'individual'}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="scope-label">
                  <strong>👤 Individual Payment</strong>
                  <small>Create payment for specific resident</small>
                </span>
              </label>
            </div>
          </div>

          {/* NEW: Resident Selection (for individual payments) */}
          {formData.paymentScope === 'individual' && (
            <div className="form-group">
              <label htmlFor="selectedResident">Select Resident *</label>
              <select
                id="selectedResident"
                name="selectedResident"
                value={formData.selectedResident}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Choose a resident...</option>
                {allResidents.map(resident => (
                  <option key={resident._id} value={resident._id}>
                    {resident.name} - {resident.apartmentNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Amount per Resident (MAD) *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="500"
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Payment Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="monthly_charge">Monthly Charge</option>
                <option value="special_assessment">Special Assessment</option>
                <option value="fine">Fine</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Monthly building charges"
              required
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="period">Period *</label>
              <input
                type="text"
                id="period"
                name="period"
                value={formData.period}
                onChange={handleChange}
                placeholder="January 2024"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Due Date *</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Enhanced Residents Preview */}
          {affectedResidents.length > 0 && (
            <div className="residents-preview">
              <h4>
                💰 Payment will be created for{' '}
                {formData.paymentScope === 'bulk' ? 'all residents' : 'selected resident'}:
              </h4>
              <div className="residents-list">
                {affectedResidents.slice(0, 5).map(resident => (
                  <div key={resident._id} className="resident-item">
                    <span className="resident-name">{resident.name}</span>
                    <span className="resident-apartment">{resident.apartmentNumber}</span>
                    <span className="resident-amount">{formData.amount} MAD</span>
                  </div>
                ))}
                {affectedResidents.length > 5 && (
                  <div className="more-residents">
                    ... and {affectedResidents.length - 5} more residents
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
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
              className="submit-btn"
              disabled={loading || affectedResidents.length === 0}
            >
              {loading ? 'Creating Payment...' : `Create Payment (${affectedResidents.length} resident${affectedResidents.length !== 1 ? 's' : ''})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePayment;