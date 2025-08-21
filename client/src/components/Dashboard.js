import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ResidentManagement from './ResidentManagement';
import PaymentManagement from './PaymentManagement';
import Expenses from './Expenses';
import TenantDashboard from './TenantDashboard';
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
    setSidebarOpen(false);
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Overview';
      case 'resident-management':
        return 'Residents';
      case 'payments':
        return isAdmin ? 'Payments' : 'My Payments';
      case 'expenses':
        return 'Expenses';
      case 'documents':
        return 'Documents';
      default:
        return 'Overview';
    }
  };

  const renderContent = () => {
    let content;
    switch (currentView) {
      case 'resident-management':
        content = <ResidentManagement />;
        break;
      case 'payments':
        content = <PaymentManagement />;
        break;
      case 'expenses':
        content = isAdmin ? (
          <Expenses />
        ) : (
          <div className="dashboard-content">
            <div className="welcome-card">
              <h3>Unauthorized</h3>
              <p>You do not have access to Expenses.</p>
            </div>
          </div>
        );
        break;
      default:
        content = isAdmin ? (
          <div className="dashboard-content">
            <div className="welcome-card">
              <h2>Welcome to Residex</h2>
              <div className="user-details">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>User ID:</strong> {user.id}</p>
              </div>
              <div className="admin-notice">
                <h3>Admin Access</h3>
                <p>You have administrative privileges in the system.</p>
              </div>
            </div>
          </div>
        ) : (
          <TenantDashboard onNavigate={(v) => setCurrentView(v)} />
        );
        break;
    }

    // Wrap ALL content (admin and tenant) in the content shell with title
    return (
      <section className="content-shell">
        <div className="content-shell-header">
          <h1 className="content-title">{getPageTitle()}</h1>
        </div>
        <div className="content-shell-body">
          {content}
        </div>
      </section>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="merged-layout">
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
            <ul className="nav-group">
              <li>
                <button 
                  className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick('dashboard')}
                >
                  <span className="nav-icon">🏠</span>
                  <span className="nav-text">Overview</span>
                </button>
              </li>

              {isAdmin && (
                <li>
                  <button 
                    className={`nav-item ${currentView === 'resident-management' ? 'active' : ''}`}
                    onClick={() => handleNavClick('resident-management')}
                  >
                    <span className="nav-icon">👥</span>
                    <span className="nav-text">Residents</span>
                  </button>
                </li>
              )}

              <li>
                <button 
                  className={`nav-item ${currentView === 'payments' ? 'active' : ''}`}
                  onClick={() => handleNavClick('payments')}
                >
                  <span className="nav-icon">💰</span>
                  <span className="nav-text">{isAdmin ? 'Payments' : 'My Payments'}</span>
                </button>
              </li>

              {isAdmin && (
                <li>
                  <button
                    className={`nav-item ${currentView === 'expenses' ? 'active' : ''}`}
                    onClick={() => handleNavClick('expenses')}
                  >
                    <span className="nav-icon">📊</span>
                    <span className="nav-text">Expenses</span>
                  </button>
                </li>
              )}

              <li>
                <button 
                  className={`nav-item ${currentView === 'documents' ? 'active' : ''}`}
                  onClick={() => handleNavClick('documents')}
                >
                  <span className="nav-icon">📄</span>
                  <span className="nav-text">Documents</span>
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

        <div className="main-area">
          {/* The header is now removed entirely */}
          <main className="page-content page-fade">
            {renderContent()}
          </main>
        </div>
      </div>

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