const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  apartmentNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true // Automatically converts to uppercase (A-101, B-205, etc.)
  },
  status: {
    type: String,
    enum: ['owner', 'tenant'],
    required: true,
    default: 'tenant'
  },
  monthlyCharge: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  // Reference to the user who created this resident (the admin/syndic)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Create compound index for unique apartment numbers per building
// (Future-proof for multi-building support)
residentSchema.index({ apartmentNumber: 1 }, { unique: true });

// Virtual for full address display
residentSchema.virtual('displayInfo').get(function() {
  return `${this.name} - Apt ${this.apartmentNumber} (${this.status})`;
});

// Method to calculate annual charges
residentSchema.methods.getAnnualCharge = function() {
  return this.monthlyCharge * 12;
};

// Static method to find residents by status
residentSchema.statics.findByStatus = function(status) {
  return this.find({ status: status });
};

module.exports = mongoose.model('Resident', residentSchema);