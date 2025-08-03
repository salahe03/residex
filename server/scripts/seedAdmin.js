const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createFirstAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Admin account already exists');
      console.log('Email:', adminExists.email);
      console.log('Name:', adminExists.name);
      return;
    }

    const hashedPassword = await bcryptjs.hash('admin123', 10);
    
    const admin = new User({
      name: "System Administrator",
      email: "admin@residex.com",
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();
    
    console.log('First admin account created successfully');
    console.log('Email: admin@residex.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('IMPORTANT: Change this password after first login');
    
  } catch (error) {
    console.error('Error creating admin:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

createFirstAdmin();