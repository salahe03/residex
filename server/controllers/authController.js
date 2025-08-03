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
    
    const { name, email, password, phone, apartmentNumber, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Validate phone and apartment for non-admin users
    if (role !== 'admin' && (!phone || !apartmentNumber)) {
      return res.status(400).json({ error: 'Phone and apartment number are required' });
    }
    
    // Check if user already exists
    console.log('2. Checking if user exists...');
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('3. User already exists!');
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    
    // Check if apartment is already taken (if provided)
    if (apartmentNumber) {
      const existingApartment = await User.findOne({ 
        apartmentNumber: apartmentNumber.toUpperCase(),
        isActive: true
      });
      
      if (existingApartment) {
        return res.status(400).json({ 
          error: `Apartment ${apartmentNumber.toUpperCase()} is already occupied by another resident` 
        });
      }
    }
    
    // Hash password for security
    console.log('4. Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    console.log('5. Creating user in database...');
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'tenant',
      phone: phone ? phone.trim() : null,
      apartmentNumber: apartmentNumber ? apartmentNumber.toUpperCase().trim() : null,
      monthlyCharge: 0,
      status: (role === 'admin') ? undefined : 'tenant',
      // Admins are active by default, others need approval
      isActive: role === 'admin' ? true : false,
      ...(role === 'admin' && { 
        approvedAt: new Date(),
        approvedBy: null
      })
    });
    
    // Save to MongoDB
    await user.save();
    console.log('6. User saved to MongoDB:', user._id);
    
    // If admin, generate token immediately and log them in
    if (role === 'admin') {
      const token = generateToken(user._id);
      console.log('7. Admin account - token generated');
      
      return res.status(201).json({
        message: 'Admin account created successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    }
    
    // For regular users, don't generate token - account needs approval
    console.log('7. User registration submitted for approval');
    
    res.status(201).json({
      message: 'Registration submitted successfully! Your account is pending admin approval. You will be notified once approved.',
      requiresApproval: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        apartmentNumber: user.apartmentNumber
      }
    });
    console.log('8. Success response sent to frontend');
    
  } catch (error) {
    console.error('Error in registerUser:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }
      if (error.keyPattern?.apartmentNumber) {
        return res.status(400).json({ error: 'This apartment number is already taken' });
      }
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join('. ') });
    }
    
    res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    console.log('1. Controller received login data:', req.body);
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    console.log('2. Looking for user in database...');
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('3. User not found!');
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    // Check if account is active
    if (!user.isActive) {
      console.log('3. Account not activated!');
      return res.status(403).json({ 
        error: 'Your account is pending admin approval. Please contact the building administrator.',
        requiresApproval: true,
        userInfo: {
          name: user.name,
          email: user.email,
          role: user.role,
          apartmentNumber: user.apartmentNumber
        }
      });
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
        role: user.role,
        isActive: user.isActive,
        // Include building data for residents
        ...(user.role !== 'admin' && {
          phone: user.phone,
          apartmentNumber: user.apartmentNumber,
          monthlyCharge: user.monthlyCharge,
          status: user.status
        })
      }
    });
    console.log('8. Login response sent to frontend');
    
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
};

module.exports = {
  registerUser,
  loginUser
};
