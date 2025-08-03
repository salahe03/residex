import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import './UserManagement.css';

const PendingUsers = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingUser, setProcessingUser] = useState(null);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await userService.getPendingUsers();
      setPendingUsers(response.data || []);
      
    } catch (error) {
      console.error('Error loading pending users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId, userName) => {
    if (!window.confirm(`Approve registration for ${userName}?`)) {
      return;
    }

    try {
      setProcessingUser(userId);
      await userService.approveUser(userId);
      
      // Refresh the list
      await loadPendingUsers();
      
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
      
      // Refresh the list
      await loadPendingUsers();
      
      console.log('User rejected successfully');
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError(error.message);
    } finally {
      setProcessingUser(null);
    }
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <div className="loading-message">
          <h3>Loading pending users...</h3>
          <p>Please wait while we fetch the pending registrations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="user-management-header">
        <div className="header-title">
          <h2>⏳ Pending Registrations</h2>
          <p>Review and approve new user registrations</p>
        </div>
        
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-number">{pendingUsers.length}</span>
            <span className="stat-label">Pending Approval</span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Pending users list */}
      {pendingUsers.length === 0 ? (
        <div className="no-users">
          <h3>No pending registrations</h3>
          <p>All user registrations have been processed.</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
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
    </div>
  );
};

export default PendingUsers;