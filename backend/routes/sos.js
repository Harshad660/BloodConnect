const express = require('express');
const router = express.Router();
const {
  createSOS,
  getMyRequests,
  getIncomingSOS,
  respondToSOS,
  getBankIncomingSOS,
  offerStockSOS,
  respondToBankOffer,
  getAllActiveSOS,
  volunteerForSOS,
  sendDirectEmail
} = require('../controllers/sosController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// All routes are protected
router.use(protect);

router.post('/', createSOS);
router.get('/my-requests', getMyRequests);
router.get('/incoming', getIncomingSOS);
router.put('/:id/respond', respondToSOS);

// All active SOS for donors to browse & volunteer
router.get('/all-active', authorize('donor'), getAllActiveSOS);
router.put('/:id/volunteer', authorize('donor'), volunteerForSOS);

// Blood Bank incoming SOS alerts and stock offering
router.get('/bank-incoming', authorize('bloodbank'), getBankIncomingSOS);
router.put('/:id/bank-offer', authorize('bloodbank'), offerStockSOS);

// Requester responds to a blood bank's stock offer
router.put('/:id/bank-offer/:offerId/respond', authorize('requester', 'admin'), respondToBankOffer);

// Requester sends direct email to a donor
router.post('/:id/send-email/:donorId', authorize('requester', 'admin'), sendDirectEmail);

module.exports = router;

