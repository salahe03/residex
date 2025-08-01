const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'your-secret-key', 
    { expiresIn: '7d' }
  );
};

// Register new user
const registerUser = async (req, res) => {
  try {
    console.log('1. Controller received registration data:', req.body);
    
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    console.log('2. Checking if user exists...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('3. User already exists!');
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password for security
    console.log('4. Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    console.log('5. Creating user in database...');
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'tenant' // Use provided role or default to tenant
    });
    
    // Save to MongoDB
    await user.save();
    console.log('6. User saved to MongoDB:', user._id);
    
    // Generate JWT token
    const token = generateToken(user._id);
    console.log('7. JWT token generated');
    
    // Send success response (without password)
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    console.log('8. Success response sent to frontend');
    
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    console.log('1. Controller received login data:', req.body);
    
    const { email, password } = req.body;
    
    // Find user by email
    console.log('2. Looking for user in database...');
    const user = await User.findOne({ email });
    if (!user) {
      console.log('3. User not found!');
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    // Check password
    console.log('4. Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('5. Password incorrect!');
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    console.log('6. Login successful!');
    
    // Generate JWT token
    const token = generateToken(user._id);
    console.log('7. JWT token generated');
    
    // Send success response (without password)
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    console.log('8. Login response sent to frontend');
    
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

module.exports = {
  registerUser,
  loginUser
};
