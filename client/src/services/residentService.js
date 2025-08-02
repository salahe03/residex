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
  // Get all residents
  getAllResidents: async () => {
    try {
      console.log('🏠 Fetching all residents...');
      
      const response = await fetch(`${API_BASE_URL}/residents`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch residents');
      }
      
      console.log('✅ Residents fetched:', data.count);
      return data;
    } catch (error) {
      console.error('❌ Error fetching residents:', error);
      throw error;
    }
  },

  // Create new resident
  createResident: async (residentData) => {
    try {
      console.log('🏠 Creating new resident:', residentData);
      
      const response = await fetch(`${API_BASE_URL}/residents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(residentData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create resident');
      }
      
      console.log('✅ Resident created:', data.data.name);
      return data;
    } catch (error) {
      console.error('❌ Error creating resident:', error);
      throw error;
    }
  },

  // Get single resident by ID
  getResidentById: async (id) => {
    try {
      console.log('🏠 Fetching resident by ID:', id);
      
      const response = await fetch(`${API_BASE_URL}/residents/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch resident');
      }
      
      console.log('✅ Resident fetched:', data.data.name);
      return data;
    } catch (error) {
      console.error('❌ Error fetching resident:', error);
      throw error;
    }
  },

  // Update resident
  updateResident: async (id, residentData) => {
    try {
      console.log('🏠 Updating resident:', id, residentData);
      
      const response = await fetch(`${API_BASE_URL}/residents/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(residentData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update resident');
      }
      
      console.log('✅ Resident updated:', data.data.name);
      return data;
    } catch (error) {
      console.error('❌ Error updating resident:', error);
      throw error;
    }
  },

  // Delete resident
  deleteResident: async (id) => {
    try {
      console.log('🏠 Deleting resident:', id);
      
      const response = await fetch(`${API_BASE_URL}/residents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete resident');
      }
      
      console.log('✅ Resident deleted');
      return data;
    } catch (error) {
      console.error('❌ Error deleting resident:', error);
      throw error;
    }
  },

  // Get resident statistics
  getResidentStats: async () => {
    try {
      console.log('📊 Fetching resident statistics...');
      
      const response = await fetch(`${API_BASE_URL}/residents/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
      
      console.log('✅ Statistics fetched:', data.data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      throw error;
    }
  }
};