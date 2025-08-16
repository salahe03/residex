const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
  try {
    if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, error: 'Server misconfiguration: JWT secret not set' });
    }

    if (process.env.NODE_ENV !== 'production') console.log('🔐 Authenticating request...');

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) return res.status(401).json({ success: false, error: 'Access token required' });

    const decoded = jwt.verify(token, JWT_SECRET || 'your-secret-key');
    if (process.env.NODE_ENV !== 'production') console.log('✅ Token verified for user:', decoded.userId);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ success: false, error: 'Invalid token' });

    // Optional: block deactivated users even if they still hold a token
    if (user.isActive === false) {
      return res.status(403).json({ success: false, error: 'Account is inactive' });
    }

    req.user = user;
    if (process.env.NODE_ENV !== 'production') console.log('✅ User authenticated:', user.email);
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('❌ Authentication error:', error.message);
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ success: false, error: 'Invalid token' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, error: 'Token expired' });
    res.status(500).json({ success: false, error: 'Server error during authentication' });
  }
};

// Defensive: handle missing req.user
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    if (process.env.NODE_ENV !== 'production') console.log('❌ Admin access required');
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  if (process.env.NODE_ENV !== 'production') console.log('✅ Admin access granted');
  next();
};

// New: allow a user to act on their own resource, or admin
const requireSelfOrAdmin = (paramKey = 'userId') => (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  if (req.params?.[paramKey] && String(req.params[paramKey]) === String(req.user?._id)) return next();
  return res.status(403).json({ success: false, error: 'Forbidden' });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireSelfOrAdmin
};