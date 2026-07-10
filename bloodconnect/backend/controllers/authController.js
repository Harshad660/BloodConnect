const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'bloodconnect_super_secret_key_12345', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, role, bloodGroup, lat, lng, city, pincode, lastDonationDate } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Validate coordinates
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude coordinates are required' });
    }

    // Create user object
    const userData = {
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'requester',
      city,
      pincode,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)], // geoJSON format is [lng, lat]
      },
    };

    if (role === 'donor') {
      if (!bloodGroup) {
        return res.status(400).json({ success: false, message: 'Blood group is required for donors' });
      }
      userData.bloodGroup = bloodGroup;
      if (lastDonationDate) {
        userData.lastDonationDate = new Date(lastDonationDate);
      }
      userData.isAvailable = true;
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        city: user.city,
        pincode: user.pincode,
        location: user.location,
        isAvailable: user.isAvailable,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during signup' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        city: user.city,
        pincode: user.pincode,
        location: user.location,
        isAvailable: user.isAvailable,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
exports.updateMe = async (req, res) => {
  try {
    const { name, phone, city, pincode, isAvailable, lastDonationDate, bloodGroup, lat, lng } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (city) user.city = city;
    if (pincode) user.pincode = pincode;
    
    if (user.role === 'donor') {
      if (isAvailable !== undefined) user.isAvailable = isAvailable;
      if (lastDonationDate !== undefined) user.lastDonationDate = lastDonationDate ? new Date(lastDonationDate) : null;
      if (bloodGroup) user.bloodGroup = bloodGroup;
    }

    // Handle location update
    if (lat !== undefined && lng !== undefined) {
      user.location = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error updating profile' });
  }
};
