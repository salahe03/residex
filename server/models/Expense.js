const mongoose = require('mongoose');

const categories = [
  'cleaning', 'electricity', 'water', 'repairs', 'maintenance',
  'security', 'salary', 'utilities', 'other'
];

const expenseSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: categories, required: true },
    date: { type: Date, required: true },
    vendor: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    receiptUrl: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ description: 'text', vendor: 'text' });

module.exports = mongoose.model('Expense', expenseSchema);