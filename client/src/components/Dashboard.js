import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ResidentManagement from './ResidentManagement';
import PaymentManagement from './PaymentManagement'; // Add this import
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    console.log('User logged out');
  };

  const handleNavClick = (view) => {
    setCurrentView(view);
    setSidebarOpen(false); // Close mobile menu
  };

  const renderContent = () => {
    switch (currentView) {
      case 'resident-management':
        return <ResidentManagement />;
      
      case 'payments':
        return <PaymentManagement />; // Add this case
      
      default:
        return (
          <div className="dashboard-content">
            <div className="welcome-card">
              <h2>Welcome to Residex</h2>
              <div className="user-details">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>User ID:</strong> {user.id}</p>
              </div>
              
              {isAdmin && (
                <div className="admin-notice">
                  <h3>Admin Access</h3>
                  <p>You have administrative privileges in the system.</p>
                </div>
              )}
            </div>

            <div className="stats-overview">
              <h3>Quick Overview</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <h4>User Approval System</h4>
                  <p>New registrations require admin approval</p>
                  <span className="status-complete">✅ Complete</span>
                </div>
                <div className="stat-item">
                  <h4>Resident Management</h4>
                  <p>Complete CRUD operations for residents</p>
                  <span className="status-complete">✅ Complete</span>
                </div>
                <div className="stat-item">
                  <h4>Payment Management</h4> {/* Update this */}
                  <p>Track payments and create bulk charges</p>
                  <span className="status-complete">✅ Complete</span> {/* Update this */}
                </div>
                <div className="stat-item">
                  <h4>Expense Tracking</h4>
                  <p>Monitor building expenses and receipts</p>
                  <span className="status-pending">⏳ Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Residex</h2>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li>
              <button 
                className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('dashboard')}
              >
                <span className="nav-icon">🏠</span>
                Dashboard
              </button>
            </li>
            
            {isAdmin && (
              <li>
                <button 
                  className={`nav-item ${currentView === 'resident-management' ? 'active' : ''}`}
                  onClick={() => handleNavClick('resident-management')}
                >
                  <span className="nav-icon">👥</span>
                  Resident Management
                </button>
              </li>
            )}
            
            <li>
              <button 
                className={`nav-item ${currentView === 'payments' ? 'active' : ''}`}
                onClick={() => handleNavClick('payments')}
              >
                <span className="nav-icon">💰</span>
                {isAdmin ? 'Payment Management' : 'My Payments'}
              </button>
            </li>
            
            <li>
              <button 
                className={`nav-item ${currentView === 'expenses' ? 'active' : ''}`}
                onClick={() => handleNavClick('expenses')}
              >
                <span className="nav-icon">📊</span>
                Expenses
              </button>
            </li>
            
            <li>
              <button 
                className={`nav-item ${currentView === 'documents' ? 'active' : ''}`}
                onClick={() => handleNavClick('documents')}
              >
                <span className="nav-icon">📄</span>
                Documents
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <p className="user-name">{user.name}</p>
              <p className="user-role">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <button 
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          
          <div className="page-title">
            {currentView === 'dashboard' && 'Dashboard'}
            {currentView === 'resident-management' && 'Resident Management'}
            {currentView === 'payments' && (isAdmin ? 'Payment Management' : 'My Payments')}
            {currentView === 'expenses' && 'Expenses'}
            {currentView === 'documents' && 'Documents'}
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Dashboard;