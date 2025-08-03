import React, { useState, useEffect } from 'react';
import { residentService } from '../services/residentService';
import { userService } from '../services/userService';
import AddResident from './AddResident';
import EditResident from './EditResident';
import './ResidentManagement.css';

const ResidentManagement = () => {
  // Active tab state
  const [activeTab, setActiveTab] = useState('residents');
  
  // Shared states across tabs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Residents tab states
  const [residents, setResidents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [deletingResident, setDeletingResident] = useState(null);
  
  // Pending users tab states
  const [pendingUsers, setPendingUsers] = useState([]);
  const [processingUser, setProcessingUser] = useState(null);
  
  // All users tab states
  const [users, setUsers] = useState([]);
  const [userFilterStatus, setUserFilterStatus] = useState('all');
  
  // Resident form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);

  // Load data on initial render and tab change
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Always load stats
      const statsResponse = await userService.getUserStats();
      setStats(statsResponse.data);
      
      // Load tab-specific data
      if (activeTab === 'residents') {
        const resResponse = await residentService.getAllResidents();
        setResidents(resResponse.data || []);
      } 
      else if (activeTab === 'pending') {
        const pendingResponse = await userService.getPendingUsers();
        setPendingUsers(pendingResponse.data || []);
      } 
      else if (activeTab === 'users') {
        const usersResponse = await userService.getAllUsers();
        setUsers(usersResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // RESIDENTS FUNCTIONS
  // =====================

  const handleAddResident = () => {
    setShowAddForm(true);
  };

  const handleEditResident = (resident) => {
    setSelectedResident(resident);
    setShowEditForm(true);
  };

  const handleResidentSuccess = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedResident(null);
    loadData();
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedResident(null);
  };

  const handleDeleteResident = async (residentId, residentName) => {
    if (!window.confirm(`Delete resident ${residentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingResident(residentId);
      await residentService.deleteResident(residentId);
      
      // Refresh the data
      loadData();
      console.log('Resident deleted successfully');
    } catch (error) {
      console.error('Error deleting resident:', error);
      setError(error.message);
    } finally {
      setDeletingResident(null);
    }
  };

  // Filter residents based on search and status
  const filteredResidents = residents.filter(resident => {
    const matchesSearch = resident.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resident.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (resident.apartmentNumber && resident.apartmentNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'tenant' && resident.status === 'tenant') ||
                          (filterStatus === 'owner' && resident.status === 'owner');
    
    return matchesSearch && matchesStatus;
  });

  // =====================
  // PENDING USERS FUNCTIONS
  // =====================
  
  const handleApproveUser = async (userId, userName) => {
    if (!window.confirm(`Approve registration for ${userName}?`)) {
      return;
    }

    try {
      setProcessingUser(userId);
      await userService.approveUser(userId);
      
      // Refresh the data
      loadData();
      console.log('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      setError(error.message);
    } finally {
      setProcessingUser(null);
    }
  };

  const handleRejectUser = async (userId, userName) => {
    if (!window.confirm(`Reject registration for ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setProcessingUser(userId);
      await userService.rejectUser(userId);
      
      // Refresh the data
      loadData();
      console.log('User rejected successfully');
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError(error.message);
    } finally {
      setProcessingUser(null);
    }
  };

  // =====================
  // ALL USERS FUNCTIONS
  // =====================

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setProcessingUser(userId);
      await userService.deleteUser(userId);
      
      // Refresh the data
      loadData();
      console.log('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message);
    } finally {
      setProcessingUser(null);
    }
  };

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = userFilterStatus === 'all' || 
                         (userFilterStatus === 'active' && user.isActive) ||
                         (userFilterStatus === 'inactive' && !user.isActive) ||
                         (userFilterStatus === user.role);
    
    return matchesSearch && matchesStatus;
  });

  // Loading state
  if (loading && !showAddForm && !showEditForm) {
    return (
      <div className="resident-management-container">
        <div className="loading-message">
          <h3>Loading data...</h3>
          <p>Please wait while we fetch the information.</p>
        </div>
      </div>
    );
  }

  // Render forms if active
  if (showAddForm) {
    return (
      <AddResident 
        onSuccess={handleResidentSuccess}
        onCancel={handleCancel}
      />
    );
  }

  if (showEditForm && selectedResident) {
    return (
      <EditResident 
        resident={selectedResident}
        onSuccess={handleResidentSuccess}
        onCancel={handleCancel}
      />
    );
  }

  // Main component render
  return (
    <div className="resident-management-container">
      {/* Tab Navigation */}
      <div className="management-tabs">
        <button 
          className={`tab-button ${activeTab === 'residents' ? 'active' : ''}`}
          onClick={() => setActiveTab('residents')}
        >
          🏠 Residents
        </button>
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending Registrations 
          {stats && stats.pendingUsers > 0 && (
            <span className="notification-badge">{stats.pendingUsers}</span>
          )}
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 All Users
        </button>
      </div>

      {/* Header with stats - Different for each tab */}
      {activeTab === 'residents' && (
        <div className="management-header">
          <div className="header-title">
            <h2>🏠 Resident Management</h2>
            <p>Manage building residents and their information</p>
          </div>
          
          {stats && (
            <div className="management-stats">
              <div className="stat-card">
                <span className="stat-number">{stats.activeUsers - stats.totalAdmins}</span>
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
                <span className="stat-number">{Math.round(stats.averageMonthlyCharge || 0)} MAD</span>
                <span className="stat-label">Avg. Monthly Charge</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="management-header">
          <div className="header-title">
            <h2>⏳ Pending Registrations</h2>
            <p>Review and approve new user registrations</p>
          </div>
          
          <div className="management-stats">
            <div className="stat-card">
              <span className="stat-number">{pendingUsers.length}</span>
              <span className="stat-label">Pending Approval</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="management-header">
          <div className="header-title">
            <h2>👥 User Management</h2>
            <p>Manage all system users and their permissions</p>
          </div>
          
          {stats && (
            <div className="management-stats">
              <div className="stat-card">
                <span className="stat-number">{stats.totalUsers}</span>
                <span className="stat-label">Total Users</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{stats.activeUsers}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{stats.pendingUsers}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{stats.totalAdmins}</span>
                <span className="stat-label">Admins</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls - Different for each tab */}
      {activeTab === 'residents' && (
        <div className="management-controls">
          <div className="search-filters">
            <input
              type="text"
              placeholder="🔍 Search by name, email, or apartment..."
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
          
          <button onClick={handleAddResident} className="add-resident-btn">
            + Add New Resident
          </button>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="management-controls">
          <div className="search-filters">
            <input
              type="text"
              placeholder="🔍 Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select
              value={userFilterStatus}
              onChange={(e) => setUserFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="admin">Admins Only</option>
              <option value="tenant">Tenants Only</option>
              <option value="landlord">Landlords Only</option>
            </select>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* RESIDENTS TAB CONTENT */}
      {activeTab === 'residents' && (
        <>
          {filteredResidents.length === 0 ? (
            <div className="no-residents">
              <h3>No residents found</h3>
              <p>
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'Start by adding your first resident.'
                }
              </p>
              <button onClick={handleAddResident} className="add-first-resident-btn">
                Add First Resident
              </button>
            </div>
          ) : (
            <div className="management-table-container">
              <table className="management-table residents-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Apartment</th>
                    <th>Status</th>
                    <th>Monthly Charge</th>
                    <th>Added Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.map((resident) => (
                    <tr key={resident._id}>
                      <td className="name-cell">
                        <span className="resident-name">{resident.name}</span>
                      </td>
                      <td className="email-cell">{resident.email}</td>
                      <td className="phone-cell">{resident.phone || '-'}</td>
                      <td className="apartment-cell">
                        <span className="apartment-number">{resident.apartmentNumber || '-'}</span>
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge ${resident.status}`}>
                          {resident.status === 'owner' ? '🏠 Owner' : '🏘️ Tenant'}
                        </span>
                      </td>
                      <td className="charge-cell">
                        {resident.monthlyCharge ? `${resident.monthlyCharge} MAD` : '-'}
                      </td>
                      <td className="date-cell">
                        {new Date(resident.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => handleEditResident(resident)}
                          className="edit-btn"
                          title="Edit resident"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteResident(resident._id, resident.name)}
                          className="delete-btn"
                          disabled={deletingResident === resident._id}
                          title="Delete resident"
                        >
                          {deletingResident === resident._id ? '⏳' : '🗑️'}
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
        </>
      )}

      {/* PENDING USERS TAB CONTENT */}
      {activeTab === 'pending' && (
        <>
          {pendingUsers.length === 0 ? (
            <div className="no-users">
              <h3>No pending registrations</h3>
              <p>All user registrations have been processed.</p>
            </div>
          ) : (
            <div className="management-table-container">
              <table className="management-table users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Registration Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="name-cell">
                        <span className="user-name">{user.name}</span>
                      </td>
                      <td className="email-cell">{user.email}</td>
                      <td className="role-cell">
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'tenant' ? '🏠 Tenant' : 
                           user.role === 'landlord' ? '🏢 Landlord' : 
                           '👨‍💼 Admin'}
                        </span>
                      </td>
                      <td className="date-cell">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => handleApproveUser(user._id, user.name)}
                          className="approve-btn"
                          disabled={processingUser === user._id}
                          title="Approve user"
                        >
                          {processingUser === user._id ? '⏳' : '✅'}
                        </button>
                        <button
                          onClick={() => handleRejectUser(user._id, user.name)}
                          className="reject-btn"
                          disabled={processingUser === user._id}
                          title="Reject user"
                        >
                          {processingUser === user._id ? '⏳' : '❌'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Results summary */}
          {pendingUsers.length > 0 && (
            <div className="results-summary">
              Showing {pendingUsers.length} pending registration{pendingUsers.length !== 1 ? 's' : ''}
            </div>
          )}
        </>
      )}

      {/* ALL USERS TAB CONTENT */}
      {activeTab === 'users' && (
        <>
          {filteredUsers.length === 0 ? (
            <div className="no-users">
              <h3>No users found</h3>
              <p>
                {searchTerm || userFilterStatus !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'No users in the system yet.'
                }
              </p>
            </div>
          ) : (
            <div className="management-table-container">
              <table className="management-table users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Approved By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="name-cell">
                        <span className="user-name">{user.name}</span>
                      </td>
                      <td className="email-cell">{user.email}</td>
                      <td className="role-cell">
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'tenant' ? '🏠 Tenant' : 
                          user.role === 'landlord' ? '🏢 Landlord' : 
                          '👨‍💼 Admin'}
                        </span>
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? '✅ Active' : '⏳ Inactive'}
                        </span>
                      </td>
                      <td className="date-cell">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="approved-cell">
                        {user.approvedBy ? (
                          <span className="approved-by">
                            {user.approvedBy.name}
                          </span>
                        ) : (
                          <span className="not-approved">-</span>
                        )}
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => handleDeleteUser(user._id, user.name)}
                          className="delete-btn"
                          disabled={processingUser === user._id || user.role === 'admin'}
                          title={user.role === 'admin' ? 'Cannot delete admin' : 'Delete user'}
                        >
                          {processingUser === user._id ? '⏳' : '🗑️'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Results summary */}
          {filteredUsers.length > 0 && (
            <div className="results-summary">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResidentManagement;