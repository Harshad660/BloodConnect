const express = require('express');
const router = express.Router();
const {
  createSOS,
  getMyRequests,
  getIncomingSOS,
  respondToSOS,
  getBankIncomingSOS,
  offerStockSOS,
  respondToBankOffer
} = require('../controllers/sosController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// All routes are protected
router.use(protect);

router.post('/', createSOS);
router.get('/my-requests', getMyRequests);
router.get('/incoming', getIncomingSOS);
router.put('/:id/respond', respondToSOS);

// Blood Bank incoming SOS alerts and stock offering
router.get('/bank-incoming', authorize('bloodbank'), getBankIncomingSOS);
router.put('/:id/bank-offer', authorize('bloodbank'), offerStockSOS);

// Requester responds to a blood bank's stock offer
router.put('/:id/bank-offer/:offerId/respond', authorize('requester', 'admin'), respondToBankOffer);

module.exports = router;
