const express = require('express');
const router = express.Router();
const {
  getPendingUsers,
  getAllUsers,
  getResidents,
  approveUser,
  updateUser,
  rejectUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Apply authentication to all user routes
router.use(authenticateToken);

// Admin-only routes
router.use(requireAdmin);

// GET /api/users/stats - Get user statistics
router.get('/stats', getUserStats);

// GET /api/users/pending - Get pending users
router.get('/pending', getPendingUsers);

// GET /api/users/residents - Get active residents (replaces old /api/residents)
router.get('/residents', getResidents);

// GET /api/users - Get all users
router.get('/', getAllUsers);

// PUT /api/users/:id/approve - Approve user
router.put('/:id/approve', approveUser);

// PUT /api/users/:id - Update user (replaces old resident update)
router.put('/:id', updateUser);

// PUT /api/users/:id/reject - Reject user
router.put('/:id/reject', rejectUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', deleteUser);

module.exports = router;