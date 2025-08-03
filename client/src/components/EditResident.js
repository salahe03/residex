import React, { useState, useEffect } from 'react';
import { residentService } from '../services/residentService';
import './ResidentForm.css';

const EditResident = ({ resident, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    apartmentNumber: '',
    status: 'tenant',
    monthlyCharge: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resident) {
      setFormData({
        name: resident.name || '',
        email: resident.email || '',
        phone: resident.phone || '',
        apartmentNumber: resident.apartmentNumber || '',
        status: resident.status || 'tenant',
        monthlyCharge: resident.monthlyCharge || ''
      });
    }
  }, [resident]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Convert monthlyCharge to number
      const residentData = {
        ...formData,
        monthlyCharge: formData.monthlyCharge ? parseFloat(formData.monthlyCharge) : 0
      };
      
      await residentService.updateResident(resident._id, residentData);
      
      console.log('Resident updated successfully');
      onSuccess(); // Navigate back to resident list
      
    } catch (error) {
      console.error('Error updating resident:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!resident) {
    return (
      <div className="resident-form-overlay">
        <div className="resident-form-container">
          <div className="loading-message">
            <h3>Loading resident data...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="resident-form-overlay">
      <div className="resident-form-container">
        <div className="resident-form-header">
          <h2>Edit Resident</h2>
          <button onClick={onCancel} className="close-btn" disabled={loading}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="resident-form">
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+212 6 12 34 56 78"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="apartmentNumber">Apartment Number *</label>
              <input
                type="text"
                id="apartmentNumber"
                name="apartmentNumber"
                value={formData.apartmentNumber}
                onChange={handleChange}
                placeholder="A-101, B-205, etc."
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Resident Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="tenant">Tenant</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="monthlyCharge">Monthly Charge (MAD) *</label>
              <input
                type="number"
                id="monthlyCharge"
                name="monthlyCharge"
                value={formData.monthlyCharge}
                onChange={handleChange}
                placeholder="500"
                min="0"
                step="0.01"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="resident-info">
            <p><strong>Created:</strong> {new Date(resident.createdAt).toLocaleDateString()}</p>
            <p><strong>Last Updated:</strong> {new Date(resident.updatedAt).toLocaleDateString()}</p>
            {resident.approvedBy && (
              <p><strong>Approved by:</strong> {resident.approvedBy.name}</p>
            )}
          </div>

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
              disabled={loading}
            >
              {loading ? 'Updating Resident...' : 'Update Resident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditResident;