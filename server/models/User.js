const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['tenant', 'landlord', 'admin'],
    default: 'tenant'
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('User', userSchema);
