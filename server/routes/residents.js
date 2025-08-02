const express = require('express');
const router = express.Router();
const {
  getAllResidents,
  createResident,
  getResidentById,
  updateResident,
  deleteResident,
  getResidentStats
} = require('../controllers/residentController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all resident routes
router.use(authenticateToken);

// GET /api/residents/stats - Get statistics (must be before /:id route)
router.get('/stats', getResidentStats);

// GET /api/residents - Get all residents
router.get('/', getAllResidents);

// POST /api/residents - Create new resident (admin only)
router.post('/', createResident);

// GET /api/residents/:id - Get single resident
router.get('/:id', getResidentById);

// PUT /api/residents/:id - Update resident (admin only)
router.put('/:id', updateResident);

// DELETE /api/residents/:id - Delete resident (admin only)
router.delete('/:id', deleteResident);

module.exports = router;