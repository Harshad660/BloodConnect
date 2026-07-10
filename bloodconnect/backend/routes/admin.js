const express = require('express');
const router = express.Router();
const {
  getAllDonors,
  verifyDonor,
  deleteUser,
  getAllSOSRequests,
  getAllBloodBanks,
  verifyBloodBank,
  deleteBloodBank
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Protect all routes and restrict to admin only
router.use(protect);
router.use(authorize('admin'));

router.get('/donors', getAllDonors);
router.put('/donors/:id/verify', verifyDonor);
router.delete('/donors/:id', deleteUser);
router.get('/sos', getAllSOSRequests);

// Blood Bank Admin Operations
router.get('/bloodbanks', getAllBloodBanks);
router.put('/bloodbanks/:id/verify', verifyBloodBank);
router.delete('/bloodbanks/:id', deleteBloodBank);

module.exports = router;
