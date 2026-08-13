const express = require('express');
const router = express.Router();
const { searchDonors, getDonorById } = require('../controllers/donorController');

router.get('/search', searchDonors);
router.get('/:id', getDonorById);

module.exports = router;
