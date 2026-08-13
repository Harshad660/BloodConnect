const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/users/me', protect, getMe);
router.put('/users/me', protect, updateMe);

module.exports = router;
