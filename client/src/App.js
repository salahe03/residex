//main react app component (rendered in root)
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext'; // Add this import
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import PageLoader from './components/ui/PageLoader';
import './App.css';

// Main app content (inside AuthProvider)
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <PageLoader title="Loading Residex…" subtitle="Preparing your dashboard" />;
  }

  // Show dashboard if authenticated, otherwise show auth page (either login or register)
  return isAuthenticated ? <Dashboard /> : <AuthPage />;
};

// Root App component with ToastProvider
function App() {
  return (
    <ToastProvider> {/* Wrap everything in ToastProvider */}
      <AuthProvider>
        <div className="App">
          <AppContent />
        </div>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
