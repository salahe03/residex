import React, { useState, useEffect, useCallback, useRef } from 'react';
import { residentService } from '../services/residentService';
import { userService } from '../services/userService';
import AddResident from './AddResident';
import EditResident from './EditResident';
import KpiTiles, { KPI_ICONS } from './ui/KpiTiles';
import './ResidentManagement.css';
import './ui/KpiTiles.css';
import SkeletonTable from './ui/SkeletonTable';
import DropdownMenu from './ui/DropdownMenu';
import { FiEdit, FiTrash, FiEye, FiUserCheck, FiUserX, FiChevronDown } from 'react-icons/fi';

// Body-level tooltip for icon buttons (uses data-tip)
const UiTooltipLayer = () => {
  const elRef = useRef(null);

  useEffect(() => {
    // Create tooltip element once
    const el = document.createElement('div');
    el.className = 'ui-tooltip';
    const inner = document.createElement('div');
    inner.className = 'ui-tooltip-inner';
    el.appendChild(inner);
    document.body.appendChild(el);
    elRef.current = el;

    let activeTarget = null;

    // NEW: position relative to the hovered icon (top-center)
    const positionToTarget = (target) => {
      if (!elRef.current || !target) return;
      const r = target.getBoundingClientRect();
      const x = r.left + r.width / 2 + window.scrollX;
      const y = r.top + window.scrollY; // anchor to top edge; CSS lifts it above
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    };

    const show = (target) => {
      activeTarget = target;
      inner.textContent = target.getAttribute('data-tip') || '';
      positionToTarget(target);
      requestAnimationFrame(() => el.classList.add('visible'));
    };

    const hide = () => {
      activeTarget = null;
      el.classList.remove('visible');
    };

    // Event delegation so it works for dynamic rows
    const onMouseOver = (e) => {
      const target = e.target.closest('.icon-btn[data-tip]');
      if (!target) return;
      show(target);
    };
    const onMouseOut = (e) => {
      if (activeTarget && !e.relatedTarget?.closest('.icon-btn[data-tip]')) {
        hide();
      }
    };

    // Keep anchored position on minor movements/scroll/resize (no pointer-follow)
    const onMouseMove = () => {
      if (activeTarget) positionToTarget(activeTarget);
    };
    const onScrollOrResize = () => {
      if (activeTarget) positionToTarget(activeTarget);
    };

    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mouseout', onMouseOut, true);
    document.addEventListener('mousemove', onMouseMove, true);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      document.removeEventListener('mouseover', onMouseOver, true);
      document.removeEventListener('mouseout', onMouseOut, true);
      document.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      if (elRef.current && elRef.current.parentNode) {
        elRef.current.parentNode.removeChild(elRef.current);
      }
    };
  }, []);

  return null;
};

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

  // Filter dropdown options
  const residentFilterOptions = [
    { id: 'all', text: 'All Residents', onClick: () => setFilterStatus('all') },
    { id: 'owner', text: 'Owners Only', onClick: () => setFilterStatus('owner') },
    { id: 'tenant', text: 'Tenants Only', onClick: () => setFilterStatus('tenant') }
  ];

  const userFilterOptions = [
    { id: 'all', text: 'All Users', onClick: () => setUserFilterStatus('all') },
    { id: 'active', text: 'Active Only', onClick: () => setUserFilterStatus('active') },
    { id: 'inactive', text: 'Inactive Only', onClick: () => setUserFilterStatus('inactive') },
    { id: 'admin', text: 'Admins Only', onClick: () => setUserFilterStatus('admin') },
    { id: 'tenant', text: 'Tenants Only', onClick: () => setUserFilterStatus('tenant') },
    { id: 'landlord', text: 'Landlords Only', onClick: () => setUserFilterStatus('landlord') }
  ];

  // Get current filter display text
  const getResidentFilterText = () => {
    switch (filterStatus) {
      case 'owner': return 'Owners Only';
      case 'tenant': return 'Tenants Only';
      default: return 'All Residents';
    }
  };

  const getUserFilterText = () => {
    switch (userFilterStatus) {
      case 'active': return 'Active Only';
      case 'inactive': return 'Inactive Only';
      case 'admin': return 'Admins Only';
      case 'tenant': return 'Tenants Only';
      case 'landlord': return 'Landlords Only';
      default: return 'All Users';
    }
  };

  // Memoize the loadData function with useCallback
  const loadData = useCallback(async () => {
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
  }, [activeTab]); // Include activeTab as dependency
  
  // Updated useEffect with proper dependencies
  useEffect(() => {
    loadData();
  }, [loadData]); // Now loadData is the only dependency

  // --- NEW: lightweight KPI skeleton (only the tiles area) ---
  const KpiSkeleton = ({ count = 4 }) => (
    <div className="kpi-skeletons">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="kpi-skeleton">
          <div className="kpi-skel-number" />
          <div className="kpi-skel-label" />
        </div>
      ))}
    </div>
  );

  // --- New: animated tab indicator ---
  const tabsRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, color: '#6366f1' });

  const ACCENTS = {
    residents: '#6366f1', // indigo
    pending:   '#f59e0b', // orange
    users:     '#10b981', // green
  };

  const updateIndicator = useCallback(() => {
    const el = tabsRef.current?.querySelector('.tab-button.active');
    const wrap = tabsRef.current;
    if (!el || !wrap) return;
    const left = el.offsetLeft;
    const width = el.offsetWidth;
    const color = ACCENTS[activeTab] || '#6366f1';
    setIndicator({ left, width, color });
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

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
    <div className="universal-page-container">
      {/* Mount once to provide body-level tooltips */}
      <UiTooltipLayer />
      {/* Tab Navigation */}
      <div className="management-tabs" ref={tabsRef}>
        <button
          className={`tab-button ${activeTab === 'residents' ? 'active' : ''}`}
          onClick={() => setActiveTab('residents')}
          style={{ '--accent': ACCENTS.residents }}
        >
          <span className="tab-dot" aria-hidden />
          🏠 Residents
        </button>
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
          style={{ '--accent': ACCENTS.pending }}
        >
          <span className="tab-dot" aria-hidden />
          ⏳ Pending Registrations
          {stats && stats.pendingUsers > 0 && (
            <span className="notification-badge">{stats.pendingUsers}</span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          style={{ '--accent': ACCENTS.users }}
        >
          <span className="tab-dot" aria-hidden />
          👥 All Users
        </button>

        {/* Sliding indicator */}
        <span
          className="tab-indicator"
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
            background: indicator.color
          }}
        />
      </div>

      {/* KPI tiles per tab: show skeleton while loading */}
      {activeTab === 'residents' && (
        stats ? (
          <KpiTiles
            items={[
              { label: 'Total Residents', value: (stats.activeUsers - stats.totalAdmins).toLocaleString(), color: 'blue',   icon: KPI_ICONS.users },
              { label: 'Owners',          value: (stats.totalOwners || 0).toLocaleString(),                            color: 'purple', icon: KPI_ICONS.wallet },
              { label: 'Tenants',         value: (stats.totalTenants || 0).toLocaleString(),                           color: 'cyan',   icon: KPI_ICONS.banknote },
              { label: 'Avg. Monthly Charge', value: `${Math.round(stats.averageMonthlyCharge || 0)} MAD`,             color: 'green',  icon: KPI_ICONS.chartUp }
            ]}
          />
        ) : loading ? <KpiSkeleton /> : null
      )}

      {activeTab === 'pending' && (
        stats ? (
          <KpiTiles
            items={[
              { label: 'Pending Approval', value: pendingUsers.length.toLocaleString(), color: 'orange', icon: KPI_ICONS.alert },
              { label: 'Active Users',     value: (stats?.activeUsers || 0).toLocaleString(), color: 'green', icon: KPI_ICONS.checkCircle },
              { label: 'Total Users',      value: (stats?.totalUsers || 0).toLocaleString(), color: 'indigo', icon: KPI_ICONS.users }
            ]}
          />
        ) : loading ? <KpiSkeleton count={3} /> : null
      )}

      {activeTab === 'users' && (
        stats ? (
          <KpiTiles
            items={[
              { label: 'Total Users', value: (stats.totalUsers || 0).toLocaleString(), color: 'indigo', icon: KPI_ICONS.users },
              { label: 'Active',      value: (stats.activeUsers || 0).toLocaleString(), color: 'green',  icon: KPI_ICONS.checkCircle },
              { label: 'Pending',     value: (stats.pendingUsers || 0).toLocaleString(), color: 'orange', icon: KPI_ICONS.alert },
              { label: 'Admins',      value: (stats.totalAdmins || 0).toLocaleString(), color: 'purple', icon: KPI_ICONS.wallet }
            ]}
          />
        ) : loading ? <KpiSkeleton /> : null
      )}

      {/* Controls stay visible even while loading */}
      {activeTab === 'residents' && (
        <div className="management-controls">
          <div className="search-filters">
            <input
              type="text"
              placeholder="Search by name, email, or apartment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <DropdownMenu
              trigger={
                <span className="filter-dropdown-trigger">
                  {getResidentFilterText()}
                  <FiChevronDown />
                </span>
              }
              options={residentFilterOptions}
              size="md"
              align="left"
              className="filter-dropdown"
            />
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
            
            <DropdownMenu
              trigger={
                <span className="filter-dropdown-trigger">
                  {getUserFilterText()}
                  <FiChevronDown />
                </span>
              }
              options={userFilterOptions}
              size="md"
              align="left"
              className="filter-dropdown"
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <div className="error-message">❌ {error}</div>}

      {/* Tables: only table area shows skeleton while loading */}
      {activeTab === 'residents' && (
        <>
          {loading ? (
            <SkeletonTable rows={8} cols={8} />
          ) : filteredResidents.length === 0 ? (
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
                        <div className="icon-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            data-tip="View details"
                            aria-label="View details"
                            onClick={() => console.log('View', resident.name)}
                          >
                            <FiEye />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            data-tip="Edit resident"
                            aria-label="Edit resident"
                            onClick={() => handleEditResident(resident)}
                          >
                            <FiEdit />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            data-tip="Delete resident"
                            aria-label="Delete resident"
                            onClick={() => handleDeleteResident(resident._id, resident.name)}
                            disabled={deletingResident === resident._id}
                          >
                            <FiTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filteredResidents.length > 0 && (
            <div className="results-summary">
              Showing {filteredResidents.length} of {residents.length} residents
            </div>
          )}
        </>
      )}

      {activeTab === 'pending' && (
        <>
          {loading ? (
            <SkeletonTable rows={6} cols={5} />
          ) : pendingUsers.length === 0 ? (
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
                        <DropdownMenu
                          size="sm"
                          options={[
                            {
                              id: 'approve',
                              text: 'Approve',
                              icon: FiUserCheck,
                              color: 'success',
                              onClick: () => handleApproveUser(user._id, user.name),
                              disabled: processingUser === user._id
                            },
                            {
                              id: 'reject',
                              text: 'Reject',
                              icon: FiUserX,
                              color: 'danger',
                              onClick: () => handleRejectUser(user._id, user.name),
                              disabled: processingUser === user._id
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && pendingUsers.length > 0 && (
            <div className="results-summary">
              Showing {pendingUsers.length} pending registration{pendingUsers.length !== 1 ? 's' : ''}
            </div>
          )}
        </>
      )}

      {activeTab === 'users' && (
        <>
          {loading ? (
            <SkeletonTable rows={8} cols={7} />
          ) : filteredUsers.length === 0 ? (
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
          {!loading && filteredUsers.length > 0 && (
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