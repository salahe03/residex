//global mem to track who's logged in 
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

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

  // Computed authentication state
  const isAuthenticated = !!user;

  // Check for existing user on app startup
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

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
        // Show success message for pending approval
        setError(''); // Clear any errors
        console.log('Registration successful, pending approval');
        
        // Show success message
        alert('✅ Registration successful!\n\nYour account is pending admin approval. The building administrator will review your application and activate your account. You will be notified once approved.');
        
        return { success: true, requiresApproval: true, user: data.user };
      } else {
        // Admin account - log them in immediately
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

  // Login function
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
      setError(error.message);
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

  // Clear error function
  const clearError = () => {
    setError('');
  };

  // Context value object
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    clearError,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    isSyndic: user?.role === 'admin', // In your system, admin = syndic
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};