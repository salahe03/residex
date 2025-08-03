const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createFirstAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/residex');
    console.log('Connected to MongoDB for seeding');

    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Admin account already exists');
      console.log('Email:', adminExists.email);
      console.log('Name:', adminExists.name);
      console.log('Active:', adminExists.isActive);
      
      // If admin exists but is inactive, activate them
      if (!adminExists.isActive) {
        await User.findByIdAndUpdate(adminExists._id, { 
          isActive: true,
          approvedAt: new Date()
        });
        console.log('✅ Admin account activated');
      }
      
      return;
    }

    const hashedPassword = await bcryptjs.hash('admin123', 10);
    
    const admin = new User({
      name: "System Administrator",
      email: "admin@residex.com",
      password: hashedPassword,
      role: "admin",
      isActive: true, // ✅ ADMIN IS ACTIVE BY DEFAULT
      approvedAt: new Date(), // ✅ SELF-APPROVED
      approvedBy: null // Self-approved, no approver needed
    });

    await admin.save();
    
    console.log('✅ First admin account created successfully');
    console.log('📧 Email: admin@residex.com');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: admin');
    console.log('✅ Status: ACTIVE (can login immediately)');
    console.log('⚠️  IMPORTANT: Change this password after first login');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    
    // Handle specific errors
    if (error.code === 11000) {
      console.error('📧 Email already exists in database');
    }
    if (error.name === 'ValidationError') {
      console.error('🔍 Validation error:', Object.values(error.errors).map(e => e.message).join(', '));
    }
    
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

createFirstAdmin();