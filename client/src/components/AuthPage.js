// this is the swicher for login/ register page
import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { useAuth } from '../contexts/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { loading } = useAuth();

  // Show loading screen during authentication
  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Loading...</h2>
            <p>Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLogin ? (
        <Login onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <Register onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </>
  );
};

export default AuthPage;