//global mem to track who's logged in 
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useToast } from './ToastContext'; // Add this import

// Define API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { showError, showSuccess, showWarning } = useToast(); // Add this

  // Computed authentication state
  const isAuthenticated = !!user;

  // Check for existing user on app startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = authService.getCurrentUser();
        const token = authService.getToken();
        
        if (savedUser && token) {
          setUser(savedUser);
          console.log('User restored from localStorage:', savedUser.email);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Clear error function
  const clearError = () => setError('');

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError('');

      console.log('Registering user with data:', userData);

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Handle successful registration
      if (data.requiresApproval) {
        setError('');
        console.log('Registration successful, pending approval');
        
        showSuccess('Registration successful! Your account is pending admin approval. You will be notified once approved.');
        
        return { success: true, requiresApproval: true, user: data.user };
      } else {
        console.log('Admin registration - logging in immediately');
        localStorage.setItem('token', data.token);
        setUser(data.user);
        
        return { success: true, requiresApproval: false, user: data.user };
      }

    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Updated Login function with toast handling
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Attempting login with:', credentials.email);
      
      const response = await authService.login(credentials);
      
      console.log('Login successful, setting user:', response.user);
      setUser(response.user);
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific inactive account error
      if (error.message.includes('pending admin approval') || error.message.includes('pending approval')) {
        // Clear form error and show toast instead
        setError('');
        showWarning(
          'Account pending approval. Please contact the building administrator to activate your account.',
          6000
        );
      } else {
        // For other errors, set the form error as usual
        setError(error.message);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    console.log('Logging out user');
    authService.logout();
    setUser(null);
    setError('');
  };

  // Check if user is admin
  const isAdmin = user && user.role === 'admin';

  // Context value object
  const value = {
    user,
    login,
    register,
    logout,
    loading,
    error,
    clearError,
    isAdmin,
    isAuthenticated,
    isSyndic: user?.role === 'admin', // In your system, admin = syndic
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};