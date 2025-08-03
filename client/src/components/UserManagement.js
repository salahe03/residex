import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingUser, setProcessingUser] = useState(null);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await userService.getAllUsers();
      setUsers(response.data || []);
      
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await userService.getUserStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setProcessingUser(userId);
      await userService.deleteUser(userId);
      
      // Refresh the list
      await loadUsers();
      await loadStats();
      
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
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive) ||
                         (filterStatus === user.role);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="user-management-container">
        <div className="loading-message">
          <h3>Loading users...</h3>
          <p>Please wait while we fetch the user data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      {/* Header with stats */}
      <div className="user-management-header">
        <div className="header-title">
          <h2>👥 User Management</h2>
          <p>Manage all system users and their permissions</p>
        </div>
        
        {stats && (
          <div className="user-stats">
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

      {/* Controls */}
      <div className="user-controls">
        <div className="search-filters">
          <input
            type="text"
            placeholder="🔍 Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
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

      {/* Error message */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Users table */}
      {filteredUsers.length === 0 ? (
        <div className="no-users">
          <h3>No users found</h3>
          <p>
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters.' 
              : 'No users in the system yet.'
            }
          </p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
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
    </div>
  );
};

export default UserManagement;