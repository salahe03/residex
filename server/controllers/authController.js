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
    const { name, email, password } = req.body;
    
    console.log('Registration request received for:', email);

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'tenant'
    });

    await user.save();
    console.log('User created with ID:', user._id);

    const token = generateToken(user._id);

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
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
