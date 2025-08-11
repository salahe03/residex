//registration form
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    apartmentNumber: '',
    role: 'tenant' // Default role
  });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showValidation, setShowValidation] = useState(false); // NEW
  const { register, loading, error, clearError } = useAuth();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  // Validate form data
  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Name is required';
    }
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (!formData.phone.trim()) {
      return 'Phone number is required';
    }
    if (!formData.apartmentNumber.trim()) {
      return 'Apartment number is required';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorMsg = validateForm();
    if (errorMsg) {
      setShowValidation(true); // show errors only after first submit attempt
      // scroll to error after DOM updates
      setTimeout(() => {
        const el = document.querySelector('.validation-error');
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 0);
      return;
    }

    try {
      // Send registration data (excluding confirmPassword)
      const { confirmPassword, ...registrationData } = formData;
      
      console.log('Sending registration request');
      const response = await register(registrationData);
      
      if (response.success) {
        if (response.requiresApproval) {
          // Show success state for pending approval
          setRegistrationSuccess(true);
        } else {
          // Admin account - they're logged in automatically
          console.log('Admin registered and logged in');
        }
      }
    } catch (error) {
      console.error('Registration failed:', error.message);
    }
  };

  // Only compute and show validation once user attempted submit
  const validationError = showValidation ? validateForm() : null;

  // Show success message for pending users
  if (registrationSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>✅ Registration Successful!</h2>
            <p>Your account is pending approval</p>
          </div>

          <div className="success-message">
            <div className="success-icon">🎉</div>
            <h3>Welcome to Residex!</h3>
            <p>Your registration has been submitted successfully.</p>
            
            <div className="next-steps">
              <h4>What happens next?</h4>
              <ul>
                <li>📋 The building administrator will review your application</li>
                <li>✅ Your account will be activated once approved</li>
                <li>📧 You'll receive confirmation via email</li>
                <li>🔐 You can then login with your credentials</li>
              </ul>
            </div>

            <div className="contact-info">
              <p><strong>Need help?</strong> Contact the building administrator</p>
            </div>
          </div>

          <div className="auth-footer">
            <button 
              type="button"
              className="auth-button"
              onClick={onSwitchToLogin}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join Residex Building Management</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Full Name <span className="required-field">*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address <span className="required-field">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number <span className="required-field">*</span></label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="+212 6 12 34 56 78"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                required
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="apartmentNumber">Apartment Number <span className="required-field">*</span></label>
              <input
                type="text"
                id="apartmentNumber"
                name="apartmentNumber"
                placeholder="A-101, B-205, etc."
                value={formData.apartmentNumber}
                onChange={handleChange}
                disabled={loading}
                required
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Type</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password <span className="required-field">*</span></label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password <span className="required-field">*</span></label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="new-password"
            />
          </div>

          {validationError && (
            <div className="validation-error">
              {validationError}
            </div>
          )}

          <div className="info-message">
            <p><strong>Note:</strong> Your account will require admin approval before you can access the system.</p>
            <p>The building administrator will review your registration and activate your account.</p>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading || (showValidation && !!validationError)}  // avoid disabling before submit
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <button 
                type="button"
                className="link-button"
                onClick={onSwitchToLogin}
                disabled={loading}
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;