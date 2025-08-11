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
    trim: true
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
  
  // Payment status - ENHANCED
  status: {
    type: String,
    enum: ['pending', 'submitted', 'paid', 'overdue'], // Added 'submitted'
    default: 'pending'
  },
  
  // Payment submission details (from tenant)
  paymentSubmission: {
    submittedAt: {
      type: Date,
      default: null
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'check', 'other'],
      default: null
    },
    paymentDate: {
      type: Date,
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
    }
  },
  
  // Admin confirmation details
  confirmation: {
    confirmedAt: {
      type: Date,
      default: null
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    adminNotes: {
      type: String,
      trim: true,
      default: null
    }
  },
  
  // MISSING FIELDS - Add these for backward compatibility and controller usage
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Legacy payment date field (for backward compatibility)
  paymentDate: {
    type: Date,
    default: null
  },
  
  // Legacy payment method field (for backward compatibility) 
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'check', 'other'],
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