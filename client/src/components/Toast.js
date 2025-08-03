import React, { useState, useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'error', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Show toast with animation
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    // Auto-hide toast after duration
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300); // Match the CSS animation duration
  };

  if (!isVisible && !isLeaving) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'error':
      default:
        return '❌';
    }
  };

  return (
    <div className={`toast toast-${type} ${isVisible && !isLeaving ? 'toast-show' : ''} ${isLeaving ? 'toast-hide' : ''}`}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <div className="toast-message">
          {message}
        </div>
        <button 
          className="toast-close" 
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
      <div className="toast-progress">
        <div 
          className="toast-progress-bar" 
          style={{ animationDuration: `${duration}ms` }}
        ></div>
      </div>
    </div>
  );
};

export default Toast;