const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 Authenticating request...');
    
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token verified for user:', decoded.userId);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }
    
    // Add user to request object
    req.user = user;
    console.log('✅ User authenticated:', user.email);
    
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Server error during authentication' 
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    console.log('❌ Admin access required');
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required' 
    });
  }
  
  console.log('✅ Admin access granted');
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin
};