const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Payment details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  period: {
    type: String,
    required: true,
    trim: true // e.g., "January 2024", "Q1 2024"
  },
  dueDate: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['monthly_charge', 'special_assessment', 'fine', 'other'],
    default: 'monthly_charge'
  },
  
  // Resident information
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  
  // Payment completion details
  paymentDate: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'check', 'other'],
    default: null
  },
  reference: {
    type: String,
    trim: true,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: null
  },
  
  // Admin who processed the payment
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
paymentSchema.index({ resident: 1, period: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Payment', paymentSchema);