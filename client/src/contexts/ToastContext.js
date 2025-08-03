import React, { createContext, useContext, useState } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'error', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after duration + animation time
    setTimeout(() => {
      removeToast(id);
    }, duration + 500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Convenience methods
  const showError = (message, duration = 5000) => showToast(message, 'error', duration);
  const showSuccess = (message, duration = 4000) => showToast(message, 'success', duration);
  const showWarning = (message, duration = 4500) => showToast(message, 'warning', duration);
  const showInfo = (message, duration = 4000) => showToast(message, 'info', duration);

  return (
    <ToastContext.Provider value={{ 
      showToast, 
      showError, 
      showSuccess, 
      showWarning, 
      showInfo,
      removeToast 
    }}>
      {children}
      
      {/* Render Toasts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};