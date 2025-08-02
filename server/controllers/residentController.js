const Resident = require('../models/Resident');

// GET /api/residents - Get all residents
const getAllResidents = async (req, res) => {
  try {
    console.log('1. Getting all residents...');
    
    const residents = await Resident.find()
      .populate('createdBy', 'name email') // Include creator info
      .sort({ apartmentNumber: 1 }); // Sort by apartment number
    
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

// POST /api/residents - Create new resident
const createResident = async (req, res) => {
  try {
    console.log('1. Creating new resident:', req.body);
    
    const { name, email, phone, apartmentNumber, status, monthlyCharge } = req.body;
    
    // Validation
    if (!name || !email || !phone || !apartmentNumber) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: name, email, phone, apartmentNumber'
      });
    }
    
    // Check if apartment number already exists
    const existingResident = await Resident.findOne({ 
      apartmentNumber: apartmentNumber.toUpperCase() 
    });
    
    if (existingResident) {
      return res.status(400).json({
        success: false,
        error: `Apartment ${apartmentNumber.toUpperCase()} is already occupied by ${existingResident.name}`
      });
    }
    
    // Create new resident
    const resident = new Resident({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      apartmentNumber: apartmentNumber.toUpperCase().trim(),
      status: status || 'tenant',
      monthlyCharge: monthlyCharge || 0,
      createdBy: req.user.userId // From JWT middleware
    });
    
    await resident.save();
    
    // Populate the createdBy field for response
    await resident.populate('createdBy', 'name email');
    
    console.log('2. Resident created successfully:', resident._id);
    
    res.status(201).json({
      success: true,
      message: 'Resident created successfully',
      data: resident
    });
    
  } catch (error) {
    console.error('Error creating resident:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Apartment number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while creating resident'
    });
  }
};

// GET /api/residents/:id - Get single resident
const getResidentById = async (req, res) => {
  try {
    console.log('1. Getting resident by ID:', req.params.id);
    
    const resident = await Resident.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      });
    }
    
    console.log('2. Resident found:', resident.name);
    
    res.json({
      success: true,
      data: resident
    });
    
  } catch (error) {
    console.error('Error getting resident:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching resident'
    });
  }
};

// PUT /api/residents/:id - Update resident
const updateResident = async (req, res) => {
  try {
    console.log('1. Updating resident:', req.params.id, req.body);
    
    const { name, email, phone, apartmentNumber, status, monthlyCharge } = req.body;
    
    // Check if apartment number is being changed and if it already exists
    if (apartmentNumber) {
      const existingResident = await Resident.findOne({
        apartmentNumber: apartmentNumber.toUpperCase(),
        _id: { $ne: req.params.id } // Exclude current resident
      });
      
      if (existingResident) {
        return res.status(400).json({
          success: false,
          error: `Apartment ${apartmentNumber.toUpperCase()} is already occupied by ${existingResident.name}`
        });
      }
    }
    
    // Update resident
    const resident = await Resident.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(apartmentNumber && { apartmentNumber: apartmentNumber.toUpperCase().trim() }),
        ...(status && { status }),
        ...(monthlyCharge !== undefined && { monthlyCharge })
      },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validations
      }
    ).populate('createdBy', 'name email');
    
    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      });
    }
    
    console.log('2. Resident updated successfully');
    
    res.json({
      success: true,
      message: 'Resident updated successfully',
      data: resident
    });
    
  } catch (error) {
    console.error('Error updating resident:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating resident'
    });
  }
};

// DELETE /api/residents/:id - Delete resident
const deleteResident = async (req, res) => {
  try {
    console.log('1. Deleting resident:', req.params.id);
    
    const resident = await Resident.findByIdAndDelete(req.params.id);
    
    if (!resident) {
      return res.status(404).json({
        success: false,
        error: 'Resident not found'
      });
    }
    
    console.log('2. Resident deleted successfully:', resident.name);
    
    res.json({
      success: true,
      message: `Resident ${resident.name} deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting resident:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting resident'
    });
  }
};

// GET /api/residents/stats - Get resident statistics
const getResidentStats = async (req, res) => {
  try {
    console.log('1. Getting resident statistics...');
    
    const stats = await Resident.aggregate([
      {
        $group: {
          _id: null,
          totalResidents: { $sum: 1 },
          totalOwners: { $sum: { $cond: [{ $eq: ['$status', 'owner'] }, 1, 0] } },
          totalTenants: { $sum: { $cond: [{ $eq: ['$status', 'tenant'] }, 1, 0] } },
          totalMonthlyCharges: { $sum: '$monthlyCharge' },
          averageMonthlyCharge: { $avg: '$monthlyCharge' }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalResidents: 0,
      totalOwners: 0,
      totalTenants: 0,
      totalMonthlyCharges: 0,
      averageMonthlyCharge: 0
    };
    
    console.log('2. Statistics calculated:', result);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error getting resident stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while getting statistics'
    });
  }
};

module.exports = {
  getAllResidents,
  createResident,
  getResidentById,
  updateResident,
  deleteResident,
  getResidentStats
};