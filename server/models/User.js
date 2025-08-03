const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Authentication fields
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
  },
  
  // Building-specific fields (only for residents)
  phone: {
    type: String,
    required: function() { return this.role !== 'admin'; },
    trim: true
  },
  apartmentNumber: {
    type: String,
    required: function() { return this.role !== 'admin'; },
    uppercase: true
  },
  monthlyCharge: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['owner', 'tenant'],
    required: function() { return this.role !== 'admin'; }
  },
  
  // Account approval system
  isActive: {
    type: Boolean,
    default: function() { 
      return this.role === 'admin' ? true : false; 
    }
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: function() {
      return this.role === 'admin' ? new Date() : null;
    }
  },
  rejectedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// This is the proper way to define the index
userSchema.index(
  { apartmentNumber: 1 }, 
  { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { apartmentNumber: { $ne: null } }
  }
);

module.exports = mongoose.model('User', userSchema);
