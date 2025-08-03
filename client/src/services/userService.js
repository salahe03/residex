
const API_BASE_URL = 'http://localhost:5000/api';

// Get JWT token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const userService = {
  // Get all pending users
  getPendingUsers: async () => {
    try {
      console.log('Fetching pending users...');
      
      const response = await fetch(`${API_BASE_URL}/users/pending`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pending users');
      }
      
      console.log('Pending users fetched:', data.count);
      return data;
    } catch (error) {
      console.error('Error fetching pending users:', error);
      throw error;
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      console.log('Fetching all users...');
      
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      console.log('Users fetched:', data.count);
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Approve user
  approveUser: async (userId) => {
    try {
      console.log('Approving user:', userId);
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve user');
      }
      
      console.log('User approved successfully');
      return data;
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  },

  // Reject user
  rejectUser: async (userId) => {
    try {
      console.log('Rejecting user:', userId);
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject user');
      }
      
      console.log('User rejected successfully');
      return data;
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      console.log('Deleting user:', userId);
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }
      
      console.log('User deleted successfully');
      return data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      console.log('Fetching user statistics...');
      
      const response = await fetch(`${API_BASE_URL}/users/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
      
      console.log('User statistics fetched:', data.data);
      return data;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw error;
    }
  }
};