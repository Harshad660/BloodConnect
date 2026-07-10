const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  getMe,
  updateMe,
  updateInventory,
  logDonation,
  getDonationHistory,
  searchBloodBanks,
  getBloodBankById,
} = require('../controllers/bloodBankController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Public endpoints
router.post('/signup', signup);
router.post('/login', login);
router.get('/search', searchBloodBanks);

// Protected profile operations
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

// Inventory and donation logs (Blood Bank role only)
router.put('/me/inventory', protect, authorize('bloodbank'), updateInventory);
router.post('/me/donations', protect, authorize('bloodbank'), logDonation);
router.get('/me/donations', protect, authorize('bloodbank'), getDonationHistory);

// Retrieve details for specific ID
router.get('/:id', getBloodBankById);

module.exports = router;
