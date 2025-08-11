const API_BASE_URL = 'http://localhost:5000/api';

// Get JWT token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const paymentService = {
  // Get all payments (admin only)
  getAllPayments: async () => {
    try {
      console.log('Fetching all payments...');
      
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payments');
      }
      
      console.log('Payments fetched:', data.count);
      return data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  // Get payments for specific user
  getUserPayments: async (userId) => {
    try {
      console.log('Fetching user payments:', userId);
      
      const response = await fetch(`${API_BASE_URL}/payments/user/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user payments');
      }
      
      console.log('User payments fetched:', data.count);
      return data;
    } catch (error) {
      console.error('Error fetching user payments:', error);
      throw error;
    }
  },

  // Create bulk/individual payments (admin only)
  createBulkPayments: async (paymentData) => {
    try {
      console.log('Creating bulk payments:', paymentData);
      
      const response = await fetch(`${API_BASE_URL}/payments/bulk-create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payments');
      }
      
      console.log('Bulk payments created successfully');
      return data;
    } catch (error) {
      console.error('Error creating bulk payments:', error);
      throw error;
    }
  },

  // Update payment (admin only)
  updatePayment: async (paymentId, paymentData) => {
    try {
      console.log('Updating payment:', paymentId);
      
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payment');
      }
      
      console.log('Payment updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  // Delete payment (admin only)
  deletePayment: async (paymentId) => {
    try {
      console.log('Deleting payment:', paymentId);
      
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete payment');
      }
      
      console.log('Payment deleted successfully');
      return data;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  },

  // Stats + new flow
  getPaymentStats: async () => {
    try {
      console.log('Fetching payment statistics...');
      
      const response = await fetch(`${API_BASE_URL}/payments/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment statistics');
      }
      
      console.log('Payment statistics fetched');
      return data;
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      throw error;
    }
  },

  // Submit payment proof (tenant)
  submitPayment: async (paymentId, paymentDetails) => {
    try {
      console.log('Submitting payment proof:', paymentId);
      
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/submit`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentDetails),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit payment');
      }
      
      console.log('Payment submitted successfully');
      return data;
    } catch (error) {
      console.error('Error submitting payment:', error);
      throw error;
    }
  },

  // Confirm payment (admin only)
  confirmPayment: async (paymentId, adminNotes = '') => {
    try {
      console.log('Confirming payment:', paymentId);
      
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/confirm`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminNotes }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm payment');
      }
      
      console.log('Payment confirmed successfully');
      return data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  // Reject payment (admin only)
  rejectPayment: async (paymentId, adminNotes = '') => {
    try {
      console.log('Rejecting payment:', paymentId);
      
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminNotes }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject payment');
      }
      
      console.log('Payment rejected successfully');
      return data;
    } catch (error) {
      console.error('Error rejecting payment:', error);
      throw error;
    }
  },
};