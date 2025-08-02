//main react app component (rendered in root)
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import './App.css';

// Main app content (inside AuthProvider)
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <h2>Loading Residex...</h2>
          <p>Please wait while we check your authentication status</p>
        </div>
      </div>
    );
  }

  // Show dashboard if authenticated, otherwise show auth page (either login or register)
  return isAuthenticated ? <Dashboard /> : <AuthPage />;
};

// Root App component
function App() {
  return ( //wrap everything in global mem (auth context)
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
