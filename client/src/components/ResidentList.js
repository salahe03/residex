import React, { useState, useEffect } from 'react';
import { residentService } from '../services/residentService';
import { useAuth } from '../contexts/AuthContext';
import './ResidentList.css';

const ResidentList = ({ onAddResident, onEditResident }) => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState(null);

  const { user } = useAuth();

  // Load residents when component mounts
  useEffect(() => {
    loadResidents();
    loadStats();
  }, []);

  const loadResidents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await residentService.getAllResidents();
      setResidents(response.data || []);
      
    } catch (error) {
      console.error('Error loading residents:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await residentService.getResidentStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDeleteResident = async (residentId, residentName) => {
    if (!window.confirm(`Are you sure you want to delete ${residentName}?`)) {
      return;
    }

    try {
      await residentService.deleteResident(residentId);
      
      // Refresh the list
      await loadResidents();
      await loadStats();
      
      console.log('Resident deleted successfully');
    } catch (error) {
      console.error('Error deleting resident:', error);
      setError(error.message);
    }
  };

  // Filter residents based on search and status
  const filteredResidents = residents.filter(resident => {
    const matchesSearch = resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resident.apartmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resident.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || resident.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="resident-list-container">
        <div className="loading-message">
          <h3>Loading residents...</h3>
          <p>Please wait while we fetch the resident data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resident-list-container">
      {/* Header with stats */}
      <div className="resident-header">
        <div className="header-title">
          <h2>👥 Resident Management</h2>
          <p>Manage all building residents and their information</p>
        </div>
        
        {stats && (
          <div className="resident-stats">
            <div className="stat-card">
              <span className="stat-number">{stats.totalResidents}</span>
              <span className="stat-label">Total Residents</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.totalOwners}</span>
              <span className="stat-label">Owners</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.totalTenants}</span>
              <span className="stat-label">Tenants</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.totalMonthlyCharges} MAD</span>
              <span className="stat-label">Monthly Revenue</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="resident-controls">
        <div className="search-filters">
          <input
            type="text"
            placeholder="🔍 Search by name, apartment, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Residents</option>
            <option value="owner">Owners Only</option>
            <option value="tenant">Tenants Only</option>
          </select>
        </div>
        
        <button 
          onClick={onAddResident}
          className="add-resident-btn"
        >
          ➕ Add New Resident
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Residents table */}
      {filteredResidents.length === 0 ? (
        <div className="no-residents">
          <h3>No residents found</h3>
          <p>
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters.' 
              : 'Start by adding your first resident.'
            }
          </p>
        </div>
      ) : (
        <div className="residents-table-container">
          <table className="residents-table">
            <thead>
              <tr>
                <th>Apartment</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Monthly Charge</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResidents.map((resident) => (
                <tr key={resident._id}>
                  <td className="apartment-cell">
                    <span className="apartment-number">{resident.apartmentNumber}</span>
                  </td>
                  <td className="name-cell">
                    <span className="resident-name">{resident.name}</span>
                  </td>
                  <td className="email-cell">{resident.email}</td>
                  <td className="phone-cell">{resident.phone}</td>
                  <td className="status-cell">
                    <span className={`status-badge ${resident.status}`}>
                      {resident.status === 'owner' ? '🏠 Owner' : '🏠 Tenant'}
                    </span>
                  </td>
                  <td className="charge-cell">
                    <span className="charge-amount">{resident.monthlyCharge} MAD</span>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => onEditResident(resident)}
                      className="edit-btn"
                      title="Edit resident"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteResident(resident._id, resident.name)}
                      className="delete-btn"
                      title="Delete resident"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results summary */}
      {filteredResidents.length > 0 && (
        <div className="results-summary">
          Showing {filteredResidents.length} of {residents.length} residents
        </div>
      )}
    </div>
  );
};

export default ResidentList;