import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    console.log('User logged out');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Welcome to Residex</h1>
          <div className="user-info">
            <span>Hello, {user.name}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="welcome-card">
            <h2>🎉 Authentication Successful!</h2>
            <div className="user-details">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>User ID:</strong> {user.id}</p>
            </div>
            
            {isAdmin && (
              <div className="admin-notice">
                <h3>🛠️ Admin Access</h3>
                <p>You have administrative privileges in the system.</p>
              </div>
            )}
          </div>
                 </div>
      </main>
    </div>
  );
};

export default Dashboard;