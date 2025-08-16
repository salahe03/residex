const mongoose = require('mongoose');

const categories = [
  'cleaning',
  'electricity',
  'water',
  'repairs',
  'maintenance',
  'security',
  'salary',
  'utilities',
  'other'
];

const allocationSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    allocatedAt: { type: Date, default: Date.now },
    allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, trim: true, default: '' },
    source: { type: String, enum: ['fund'], default: 'fund' }
  },
  { _id: true }
);

const expenseSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: categories, required: true },
    date: { type: Date, required: true },
    vendor: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    receiptUrl: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // NEW: allocations applied from collected fund
    allocations: { type: [allocationSchema], default: [] }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Text index for search
expenseSchema.index({ description: 'text', vendor: 'text' });
// Query performance indexes
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1, date: -1 });

// Virtuals
expenseSchema.virtual('allocatedTotal').get(function () {
  return (this.allocations || []).reduce((s, a) => s + (a.amount || 0), 0);
});
expenseSchema.virtual('remainingAmount').get(function () {
  const rem = Number(this.amount || 0) - Number(this.allocatedTotal || 0);
  return rem < 0 ? 0 : rem;
});
expenseSchema.virtual('computedStatus').get(function () {
  if ((this.allocatedTotal || 0) <= 0) return 'unpaid';
  if ((this.allocatedTotal || 0) < (this.amount || 0)) return 'partially_paid';
  return 'paid';
});

module.exports = mongoose.model('Expense', expenseSchema);