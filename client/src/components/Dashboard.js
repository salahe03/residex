import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ResidentList from './ResidentList';
import AddResident from './AddResident';
import EditResident from './EditResident';
import PendingUsers from './PendingUsers';
import UserManagement from './UserManagement';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedResident, setSelectedResident] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    console.log('User logged out');
  };

  const handleAddResident = () => {
    setCurrentView('add-resident');
  };

  const handleEditResident = (resident) => {
    setSelectedResident(resident);
    setCurrentView('edit-resident');
  };

  const handleResidentSuccess = () => {
    setCurrentView('residents');
    setSelectedResident(null);
  };

  const handleCancel = () => {
    if (currentView === 'add-resident' || currentView === 'edit-resident') {
      setCurrentView('residents');
    } else {
      setCurrentView('dashboard');
    }
    setSelectedResident(null);
  };

  const handleNavClick = (view) => {
    setCurrentView(view);
    setSidebarOpen(false); // Close mobile menu
  };

  const renderContent = () => {
    switch (currentView) {
      case 'residents':
        return (
          <ResidentList 
            onAddResident={handleAddResident}
            onEditResident={handleEditResident}
          />
        );
      
      case 'add-resident':
        return (
          <AddResident 
            onSuccess={handleResidentSuccess}
            onCancel={handleCancel}
          />
        );
      
      case 'edit-resident':
        return (
          <EditResident 
            resident={selectedResident}
            onSuccess={handleResidentSuccess}
            onCancel={handleCancel}
          />
        );
      
      case 'pending-users':
        return <PendingUsers />;
      
      case 'user-management':
        return <UserManagement />;
      
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
                  <h4>Payment Tracking</h4>
                  <p>Track monthly charges and payments</p>
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
                <span className="nav-text">Dashboard</span>
              </button>
            </li>
            
            {isAdmin && (
              <>
                <li>
                  <button 
                    className={`nav-item ${currentView === 'pending-users' ? 'active' : ''}`}
                    onClick={() => handleNavClick('pending-users')}
                  >
                    <span className="nav-icon">⏳</span>
                    <span className="nav-text">Pending Users</span>
                  </button>
                </li>
                
                <li>
                  <button 
                    className={`nav-item ${currentView === 'user-management' ? 'active' : ''}`}
                    onClick={() => handleNavClick('user-management')}
                  >
                    <span className="nav-icon">👤</span>
                    <span className="nav-text">User Management</span>
                  </button>
                </li>
                
                <li>
                  <button 
                    className={`nav-item ${currentView === 'residents' ? 'active' : ''}`}
                    onClick={() => handleNavClick('residents')}
                  >
                    <span className="nav-icon">👥</span>
                    <span className="nav-text">Residents</span>
                  </button>
                </li>
                
                <li>
                  <button 
                    className="nav-item disabled"
                    disabled
                  >
                    <span className="nav-icon">💰</span>
                    <span className="nav-text">Payments</span>
                  </button>
                </li>
                
                <li>
                  <button 
                    className="nav-item disabled"
                    disabled
                  >
                    <span className="nav-icon">📊</span>
                    <span className="nav-text">Expenses</span>
                  </button>
                </li>
                
                <li>
                  <button 
                    className="nav-item disabled"
                    disabled
                  >
                    <span className="nav-icon">📄</span>
                    <span className="nav-text">Documents</span>
                  </button>
                </li>
              </>
            )}
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
            {currentView === 'pending-users' && 'Pending Users'}
            {currentView === 'user-management' && 'User Management'}
            {currentView === 'residents' && 'Resident Management'}
            {currentView === 'add-resident' && 'Add New Resident'}
            {currentView === 'edit-resident' && 'Edit Resident'}
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;