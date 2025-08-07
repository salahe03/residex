const Payment = require('../models/Payment');
const User = require('../models/User');

// GET /api/payments/stats - Get payment statistics (Admin only)
const getPaymentStats = async (req, res) => {
  try {
    console.log('1. Getting payment statistics...');
    
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          paidAmount: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] 
            } 
          },
          pendingAmount: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] 
            } 
          },
          overdueAmount: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'overdue'] }, '$amount', 0] 
            } 
          },
          averagePayment: { $avg: '$amount' }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalPayments: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      averagePayment: 0
    };
    
    console.log('2. Payment statistics calculated');
    
    res.json({
      success: true,
      data: {
        total: {
          count: result.totalPayments,
          totalAmount: result.totalAmount,
          paidAmount: result.paidAmount,
          pendingAmount: result.pendingAmount,
          overdueAmount: result.overdueAmount
        },
        averagePayment: result.averagePayment || 0
      }
    });
    
  } catch (error) {
    console.error('Error getting payment statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching payment statistics'
    });
  }
};

// GET /api/payments/user/:userId - Get payments for specific user
const getUserPayments = async (req, res) => {
  try {
    console.log('1. Getting user payments for:', req.params.userId);
    
    const userId = req.params.userId;
    
    const payments = await Payment.find({ resident: userId })
      .populate('resident', 'name email apartmentNumber')
      .populate('processedBy', 'name email')
      .sort({ dueDate: -1 });
    
    console.log(`2. Found ${payments.length} payments for user`);
    
    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
    
  } catch (error) {
    console.error('Error getting user payments:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user payments'
    });
  }
};

// GET /api/payments - Get all payments (Admin only)
const getAllPayments = async (req, res) => {
  try {
    console.log('1. Getting all payments...');
    
    const payments = await Payment.find()
      .populate('resident', 'name email apartmentNumber')
      .populate('processedBy', 'name email')
      .sort({ dueDate: -1 });
    
    console.log(`2. Found ${payments.length} total payments`);
    
    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
    
  } catch (error) {
    console.error('Error getting all payments:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching payments'
    });
  }
};

// POST /api/payments/bulk-create - Create bulk payments for all residents (Admin only)
const createBulkPayments = async (req, res) => {
  try {
    console.log('1. Creating payments...');
    
    const { amount, description, period, dueDate, type = 'monthly_charge', targetResidents } = req.body;
    
    // Validate required fields
    if (!amount || !description || !period || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Amount, description, period, and due date are required'
      });
    }
    
    let residents;
    
    // NEW: Handle targeted residents for individual payments
    if (targetResidents && targetResidents.length > 0) {
      residents = await User.find({ 
        _id: { $in: targetResidents },
        role: { $ne: 'admin' },
        isActive: true
      });
      
      if (residents.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid target residents found'
        });
      }
    } else {
      // Get all active residents (existing bulk logic)
      residents = await User.find({ 
        role: { $ne: 'admin' },
        isActive: true
      });
      
      if (residents.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No active residents found'
        });
      }
    }
    
    // Create payments for selected residents
    const paymentPromises = residents.map(resident => {
      return new Payment({
        amount,
        description,
        period,
        dueDate: new Date(dueDate),
        type,
        resident: resident._id,
        status: 'pending'
      }).save();
    });
    
    const createdPayments = await Promise.all(paymentPromises);
    
    console.log(`2. Created ${createdPayments.length} payments`);
    
    res.status(201).json({
      success: true,
      message: `Created ${createdPayments.length} payment${createdPayments.length !== 1 ? 's' : ''} for resident${createdPayments.length !== 1 ? 's' : ''}`,
      data: {
        count: createdPayments.length,
        payments: createdPayments
      }
    });
    
  } catch (error) {
    console.error('Error creating payments:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating payments'
    });
  }
};

// PUT /api/payments/:id/mark-paid - Mark payment as paid (Admin only)
const markPaymentPaid = async (req, res) => {
  try {
    console.log('1. Marking payment as paid:', req.params.id);
    
    const paymentId = req.params.id;
    const { paymentMethod, paymentDate, reference, notes } = req.body;
    const adminId = req.user._id;
    
    // Validate required fields
    if (!paymentMethod || !paymentDate) {
      return res.status(400).json({
        success: false,
        error: 'Payment method and payment date are required'
      });
    }
    
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'paid',
        paymentDate: new Date(paymentDate),
        paymentMethod,
        reference: reference || null,
        notes: notes || null,
        processedBy: adminId
      },
      { new: true, runValidators: true }
    ).populate('resident', 'name email apartmentNumber')
     .populate('processedBy', 'name email');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    console.log('2. Payment marked as paid successfully');
    
    res.json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: payment
    });
    
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while marking payment as paid'
    });
  }
};

// PUT /api/payments/:id - Update payment (Admin only)
const updatePayment = async (req, res) => {
  try {
    console.log('1. Updating payment:', req.params.id);
    
    const paymentId = req.params.id;
    const updateData = req.body;
    
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      updateData,
      { new: true, runValidators: true }
    ).populate('resident', 'name email apartmentNumber')
     .populate('processedBy', 'name email');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    console.log('2. Payment updated successfully');
    
    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
    
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating payment'
    });
  }
};

// DELETE /api/payments/:id - Delete payment (Admin only)
const deletePayment = async (req, res) => {
  try {
    console.log('1. Deleting payment:', req.params.id);
    
    const paymentId = req.params.id;
    
    const payment = await Payment.findByIdAndDelete(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    console.log('2. Payment deleted successfully');
    
    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting payment'
    });
  }
};

module.exports = {
  getAllPayments,
  getUserPayments,
  createBulkPayments,
  markPaymentPaid,
  updatePayment,
  deletePayment,
  getPaymentStats
};