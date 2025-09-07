import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ResidentManagement from './ResidentManagement';
import PaymentManagement from './PaymentManagement';
import Expenses from './Expenses';
import TenantDashboard from './TenantDashboard';
import './Dashboard.css';
import { FiHome, FiUsers, FiDollarSign, FiBarChart2, FiFileText } from 'react-icons/fi';

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

  // NEW: unified nav config (replaces emoji buttons + "Main" label)
  const navItems = [
    { key: 'dashboard', label: 'Overview', icon: <FiHome /> },
    ...(isAdmin ? [{ key: 'resident-management', label: 'Residents', icon: <FiUsers /> }] : []),
    { key: 'payments', label: isAdmin ? 'Payments' : 'My Payments', icon: <FiDollarSign /> },
    ...(isAdmin ? [{ key: 'expenses', label: 'Expenses', icon: <FiBarChart2 /> }] : []),
    { key: 'documents', label: 'Documents', icon: <FiFileText /> }
  ];

  return (
    <div className="dashboard-container">
      <div className="merged-layout">
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-header">
            <h2>Residex</h2>
            <button 
              className="sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              ×
            </button>
          </div>

            {/* NEW SIDEBAR NAV */}
            <nav className="sidebar-nav">
              <ul className="nav-group">
                {navItems.map(item => {
                  const active = currentView === item.key;
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        className={`nav-item${active ? ' active' : ''}`}
                        onClick={() => handleNavClick(item.key)}
                        aria-current={active ? 'page' : undefined}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                        <span className="nav-active-glow" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

          <div className="sidebar-footer">
  <div className="sidebar-user">
    <div className="user-avatar">
      {(user?.name && user.name[0]) ? user.name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U')}
    </div>
    <div className="user-meta">
      <div className="user-name">{user?.name || 'User'}</div>
      <div className="user-role">{isAdmin ? 'Admin' : 'Tenant'}</div>
    </div>
  </div>
  <button className="logout-btn" onClick={handleLogout}>
    Logout
  </button>
</div>
        </aside>

        <div className="main-area">
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