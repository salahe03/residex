const API_BASE_URL = 'http://localhost:5000/api';

// Get JWT token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const residentService = {
  // Get all active residents (users who are not admins)
  getAllResidents: async () => {
    try {
      console.log('Fetching all residents...');
      
      const response = await fetch(`${API_BASE_URL}/users/residents`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch residents');
      }
      
      console.log('Residents fetched:', data.count);
      return data;
    } catch (error) {
      console.error('Error fetching residents:', error);
      throw error;
    }
  },

  // Create new resident (actually creates a user and activates them)
  createResident: async (residentData) => {
    try {
      console.log('Creating new resident:', residentData);
      
      // Step 1: Create user account
      const userResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: residentData.name,
          email: residentData.email,
          password: `Temp${Math.random().toString(36).slice(-8)}!`, // Random password
          phone: residentData.phone,
          apartmentNumber: residentData.apartmentNumber,
          role: 'tenant'
        }),
      });

      const userData = await userResponse.json();
      
      if (!userResponse.ok) {
        throw new Error(userData.error || 'Failed to create user account');
      }

      // Step 2: Immediately approve the user (admin is creating them)
      const approvalResponse = await fetch(`${API_BASE_URL}/users/${userData.user.id}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          monthlyCharge: residentData.monthlyCharge,
          apartmentNumber: residentData.apartmentNumber,
          status: residentData.status
        }),
      });

      const approvalData = await approvalResponse.json();
      
      if (!approvalResponse.ok) {
        throw new Error(approvalData.error || 'Failed to approve user');
      }
      
      console.log('Resident created and approved successfully');
      return approvalData;
    } catch (error) {
      console.error('Error creating resident:', error);
      throw error;
    }
  },

  // Update resident (actually updates user)
  updateResident: async (residentId, residentData) => {
    try {
      console.log('Updating resident:', residentId, residentData);
      
      const response = await fetch(`${API_BASE_URL}/users/${residentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(residentData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update resident');
      }
      
      console.log('Resident updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating resident:', error);
      throw error;
    }
  },

  // Delete resident (actually deletes user)
  deleteResident: async (residentId) => {
    try {
      console.log('Deleting resident:', residentId);
      
      const response = await fetch(`${API_BASE_URL}/users/${residentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete resident');
      }
      
      console.log('Resident deleted successfully');
      return data;
    } catch (error) {
      console.error('Error deleting resident:', error);
      throw error;
    }
  },

  // Get resident statistics
  getResidentStats: async () => {
    try {
      console.log('Fetching resident statistics...');
      
      const response = await fetch(`${API_BASE_URL}/users/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
      
      console.log('Resident statistics fetched');
      return data;
    } catch (error) {
      console.error('Error fetching resident statistics:', error);
      throw error;
    }
  }
};