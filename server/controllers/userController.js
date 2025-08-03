const User = require('../models/User');

// GET /api/users/pending - Get all pending users
const getPendingUsers = async (req, res) => {
  try {
    console.log('1. Getting pending users...');
    
    const pendingUsers = await User.find({ 
      isActive: false,
      rejectedAt: null
    })
    .select('-password')
    .sort({ createdAt: -1 });
    
    console.log(`2. Found ${pendingUsers.length} pending users`);
    
    res.json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers
    });
    
  } catch (error) {
    console.error('Error getting pending users:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching pending users'
    });
  }
};

// GET /api/users/residents - Get all active residents (not admins)
const getResidents = async (req, res) => {
  try {
    console.log('1. Getting all residents...');
    
    const residents = await User.find({ 
      role: { $ne: 'admin' },
      isActive: true
    })
    .select('-password')
    .populate('approvedBy', 'name email')
    .sort({ apartmentNumber: 1 });
    
    console.log(`2. Found ${residents.length} residents`);
    
    res.json({
      success: true,
      count: residents.length,
      data: residents
    });
    
  } catch (error) {
    console.error('Error getting residents:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching residents'
    });
  }
};

// PUT /api/users/:id/approve - Approve a pending user
const approveUser = async (req, res) => {
  try {
    console.log('1. Approving user:', req.params.id);
    
    const { monthlyCharge, apartmentNumber, status } = req.body;
    const userId = req.params.id;
    const adminId = req.user._id;
    
    // Find and update user
    const updateData = {
      isActive: true,
      approvedBy: adminId,
      approvedAt: new Date()
    };
    
    // Add building data if provided by admin
    if (monthlyCharge !== undefined) updateData.monthlyCharge = monthlyCharge;
    if (apartmentNumber) updateData.apartmentNumber = apartmentNumber.toUpperCase();
    if (status) updateData.status = status;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).populate('approvedBy', 'name email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log('2. User approved successfully:', user.email);
    
    res.json({
      success: true,
      message: `User ${user.name} approved successfully`,
      data: user
    });
    
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while approving user'
    });
  }
};

// PUT /api/users/:id - Update user (building info)
const updateUser = async (req, res) => {
  try {
    console.log('1. Updating user:', req.params.id, req.body);
    
    const { name, email, phone, apartmentNumber, status, monthlyCharge } = req.body;
    const userId = req.params.id;
    
    // Check if apartment number is being changed and if it already exists
    if (apartmentNumber) {
      const existingUser = await User.findOne({
        apartmentNumber: apartmentNumber.toUpperCase(),
        _id: { $ne: userId },
        isActive: true
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: `Apartment ${apartmentNumber.toUpperCase()} is already occupied by ${existingUser.name}`
        });
      }
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(apartmentNumber && { apartmentNumber: apartmentNumber.toUpperCase().trim() }),
        ...(status && { status }),
        ...(monthlyCharge !== undefined && { monthlyCharge })
      },
      { 
        new: true,
        runValidators: true
      }
    ).select('-password').populate('approvedBy', 'name email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log('2. User updated successfully');
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating user'
    });
  }
};

// GET /api/users/stats - Get statistics
const getUserStats = async (req, res) => {
  try {
    console.log('1. Getting user statistics...');
    
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          pendingUsers: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$isActive', false] }, { $eq: ['$rejectedAt', null] }] }, 
                1, 
                0
              ] 
            } 
          },
          totalAdmins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          totalTenants: { $sum: { $cond: [{ $eq: ['$role', 'tenant'] }, 1, 0] } },
          totalOwners: { $sum: { $cond: [{ $eq: ['$status', 'owner'] }, 1, 0] } },
          totalMonthlyCharges: { $sum: '$monthlyCharge' },
          averageMonthlyCharge: { $avg: '$monthlyCharge' }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      pendingUsers: 0,
      totalAdmins: 0,
      totalTenants: 0,
      totalOwners: 0,
      totalMonthlyCharges: 0,
      averageMonthlyCharge: 0
    };
    
    console.log('2. Statistics calculated:', result);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while getting statistics'
    });
  }
};

// Other functions remain the same...
const getAllUsers = async (req, res) => {
  try {
    console.log('1. Getting all users...');
    
    const users = await User.find({ rejectedAt: null })
      .select('-password')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`2. Found ${users.length} users`);
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
    
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching users'
    });
  }
};

const rejectUser = async (req, res) => {
  try {
    console.log('1. Rejecting user:', req.params.id);
    
    const userId = req.params.id;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { rejectedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log('2. User rejected successfully:', user.email);
    
    res.json({
      success: true,
      message: `User ${user.name} rejected successfully`,
      data: user
    });
    
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while rejecting user'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    console.log('1. Deleting user:', req.params.id);
    
    const userId = req.params.id;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log('2. User deleted successfully:', user.email);
    
    res.json({
      success: true,
      message: `User ${user.name} deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting user'
    });
  }
};

module.exports = {
  getPendingUsers,
  getAllUsers,
  getResidents,  // NEW: Get residents only
  approveUser,
  updateUser,    // NEW: Update user/resident info
  rejectUser,
  deleteUser,
  getUserStats
};