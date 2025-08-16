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

// PUT /api/payments/:id/submit - Submit payment proof (Tenant)
const submitPayment = async (req, res) => {
  try {
    console.log('1. Tenant submitting payment:', req.params.id);
    
    const paymentId = req.params.id;
    const { paymentMethod, paymentDate, reference, notes } = req.body;
    const userId = req.user._id;
    
    // Validate required fields
    if (!paymentMethod || !paymentDate) {
      return res.status(400).json({
        success: false,
        error: 'Payment method and payment date are required'
      });
    }
    
    // Find the payment and verify it belongs to the user
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    // Check if payment belongs to the requesting user (unless admin)
    if (req.user.role !== 'admin' && payment.resident.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only submit payment for your own charges'
      });
    }
    
    // Check if payment is in submittable state - UPDATED to include 'rejected'
    if (!['pending', 'overdue', 'rejected'].includes(payment.status)) {
      return res.status(400).json({
        success: false,
        error: 'Payment has already been submitted or confirmed'
      });
    }
    
    // Update payment with submission details
    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'submitted',
        'paymentSubmission.submittedAt': new Date(),
        'paymentSubmission.paymentMethod': paymentMethod,
        'paymentSubmission.paymentDate': new Date(paymentDate),
        'paymentSubmission.reference': reference || null,
        'paymentSubmission.notes': notes || null
      },
      { new: true, runValidators: true }
    ).populate('resident', 'name email apartmentNumber');
    
    console.log('2. Payment submitted successfully');
    
    res.json({
      success: true,
      message: 'Payment submitted successfully. Awaiting admin confirmation.',
      data: updatedPayment
    });
    
  } catch (error) {
    console.error('Error submitting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while submitting payment'
    });
  }
};

// PUT /api/payments/:id/confirm - Confirm payment (Admin only)
const confirmPayment = async (req, res) => {
  try {
    console.log('1. Admin confirming payment:', req.params.id);
    
    const paymentId = req.params.id;
    const { adminNotes } = req.body;
    const adminId = req.user._id;
    
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'paid',
        'confirmation.confirmedAt': new Date(),
        'confirmation.confirmedBy': adminId,
        'confirmation.adminNotes': adminNotes || null
      },
      { new: true, runValidators: true }
    ).populate('resident', 'name email apartmentNumber')
     .populate('confirmation.confirmedBy', 'name email');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    console.log('2. Payment confirmed successfully');
    
    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: payment
    });
    
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while confirming payment'
    });
  }
};

// PUT /api/payments/:id/reject - Reject payment submission (Admin only)
const rejectPayment = async (req, res) => {
  try {
    console.log('1. Admin rejecting payment:', req.params.id);
    
    const paymentId = req.params.id;
    const { adminNotes } = req.body;
    
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'rejected', // Changed from 'pending' to 'rejected'
        'paymentSubmission.submittedAt': null,
        'paymentSubmission.paymentMethod': null,
        'paymentSubmission.paymentDate': null,
        'paymentSubmission.reference': null,
        'paymentSubmission.notes': null,
        'confirmation.adminNotes': adminNotes || 'Payment submission rejected'
      },
      { new: true, runValidators: true }
    ).populate('resident', 'name email apartmentNumber');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    console.log('2. Payment submission rejected');
    
    res.json({
      success: true,
      message: 'Payment submission rejected',
      data: payment
    });
    
  } catch (error) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while rejecting payment'
    });
  }
};

// PUT /api/payments/:id - Update payment (Admin only)
const updatePayment = async (req, res) => {
  try {
    console.log('1. Updating payment:', req.params.id);
    
    const paymentId = req.params.id;
    const { amount, description, period, dueDate, type } = req.body;
    
    // Validate required fields
    if (!amount || !description || !period || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Amount, description, period, and due date are required'
      });
    }
    
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        amount: parseFloat(amount),
        description: description.trim(),
        period: period.trim(),
        dueDate: new Date(dueDate),
        type: type || 'monthly_charge'
      },
      { new: true, runValidators: true }
    ).populate('resident', 'name email apartmentNumber');
    
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
      message: 'Payment deleted successfully',
      data: { deletedPaymentId: paymentId }
    });
    
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting payment'
    });
  }
};

// Remove the old markPaymentPaid function and replace with these new ones
module.exports = {
  getAllPayments,
  getUserPayments,
  createBulkPayments,
  submitPayment,    // NEW: For tenants
  confirmPayment,   // NEW: For admin
  rejectPayment,    // NEW: For admin
  updatePayment,    // NOW DEFINED
  deletePayment,    // NOW DEFINED
  getPaymentStats
};