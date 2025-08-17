import React, { useState, useEffect, useCallback } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'error', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Stable close handler for effects
  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 280); // Match the CSS closing animation duration
  }, [onClose]);

  useEffect(() => {
    // Mount hidden (offscreen), then animate in
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    const hideTimer = setTimeout(() => handleClose(), duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, handleClose]);

  // NOTE: keep rendering so the base .toast styles apply first; then .toast-show animates in
  // Removed the early return that prevented mount on first paint

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
    <div
      className={`toast toast-${type} ${isVisible && !isLeaving ? 'toast-show' : ''} ${isLeaving ? 'toast-hide' : ''}`}
      aria-live="polite"
      aria-atomic="true"
    >
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