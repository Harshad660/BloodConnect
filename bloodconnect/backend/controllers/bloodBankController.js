const BloodBank = require('../models/BloodBank');
const User = require('../models/User');
const Donation = require('../models/Donation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'bloodconnect_super_secret_key_12345', {
    expiresIn: '30d',
  });
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// @desc    Register a new blood bank
// @route   POST /api/bloodbank/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { name, licenceNumber, email, password, phone, address, city, lat, lng, lowStockThreshold } = req.body;

    if (!name || !licenceNumber || !email || !password || !phone || !address || !city || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Email check across users and blood banks
    const userExists = await User.findOne({ email });
    const bankExists = await BloodBank.findOne({ email });
    if (userExists || bankExists) {
      return res.status(400).json({ success: false, message: 'An account already exists with this email' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Initialize inventory with 0 units for each blood group
    const initialInventory = BLOOD_GROUPS.map((bg) => ({
      bloodGroup: bg,
      units: 0,
      lastUpdated: new Date(),
    }));

    const bloodBank = await BloodBank.create({
      name,
      licenceNumber,
      email,
      password: hashedPassword,
      phone,
      address,
      city,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)], // [lng, lat]
      },
      inventory: initialInventory,
      lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : 5,
      isVerified: false,
    });

    res.status(201).json({
      success: true,
      token: generateToken(bloodBank._id),
      user: {
        _id: bloodBank._id,
        name: bloodBank.name,
        licenceNumber: bloodBank.licenceNumber,
        email: bloodBank.email,
        phone: bloodBank.phone,
        address: bloodBank.address,
        city: bloodBank.city,
        location: bloodBank.location,
        inventory: bloodBank.inventory,
        lowStockThreshold: bloodBank.lowStockThreshold,
        isVerified: bloodBank.isVerified,
        role: bloodBank.role,
      },
    });
  } catch (error) {
    console.error('Blood Bank signup error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during Blood Bank registration' });
  }
};

// @desc    Authenticate blood bank & get token
// @route   POST /api/bloodbank/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const bloodBank = await BloodBank.findOne({ email });
    if (!bloodBank) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, bloodBank.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(bloodBank._id),
      user: {
        _id: bloodBank._id,
        name: bloodBank.name,
        licenceNumber: bloodBank.licenceNumber,
        email: bloodBank.email,
        phone: bloodBank.phone,
        address: bloodBank.address,
        city: bloodBank.city,
        location: bloodBank.location,
        inventory: bloodBank.inventory,
        lowStockThreshold: bloodBank.lowStockThreshold,
        isVerified: bloodBank.isVerified,
        role: bloodBank.role,
      },
    });
  } catch (error) {
    console.error('Blood Bank login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get current blood bank profile
// @route   GET /api/bloodbank/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('Get Blood Bank profile error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

// @desc    Update blood bank profile/location
// @route   PUT /api/bloodbank/me
// @access  Private
exports.updateMe = async (req, res) => {
  try {
    const { name, licenceNumber, phone, address, city, lat, lng, lowStockThreshold } = req.body;
    const bloodBank = await BloodBank.findById(req.user._id);

    if (!bloodBank) {
      return res.status(404).json({ success: false, message: 'Blood bank profile not found' });
    }

    if (name) bloodBank.name = name;
    if (licenceNumber) bloodBank.licenceNumber = licenceNumber;
    if (phone) bloodBank.phone = phone;
    if (address) bloodBank.address = address;
    if (city) bloodBank.city = city;
    if (lowStockThreshold !== undefined) bloodBank.lowStockThreshold = parseInt(lowStockThreshold);

    if (lat !== undefined && lng !== undefined) {
      bloodBank.location = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
      };
    }

    await bloodBank.save();

    res.status(200).json({
      success: true,
      user: bloodBank,
    });
  } catch (error) {
    console.error('Update Blood Bank profile error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error updating profile' });
  }
};

// @desc    Update stock units for a blood group
// @route   PUT /api/bloodbank/me/inventory
// @access  Private
exports.updateInventory = async (req, res) => {
  try {
    const { bloodGroup, units } = req.body;

    if (!bloodGroup || units === undefined) {
      return res.status(400).json({ success: false, message: 'Blood group and units count are required' });
    }

    if (!BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({ success: false, message: 'Invalid blood group type' });
    }

    const bloodBank = await BloodBank.findById(req.user._id);
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: 'Blood bank not found' });
    }

    // Find the item inside inventory array
    const itemIndex = bloodBank.inventory.findIndex((item) => item.bloodGroup === bloodGroup);

    const numericUnits = parseInt(units);
    if (itemIndex > -1) {
      bloodBank.inventory[itemIndex].units = numericUnits;
      bloodBank.inventory[itemIndex].lastUpdated = new Date();
    } else {
      bloodBank.inventory.push({
        bloodGroup,
        units: numericUnits,
        lastUpdated: new Date(),
      });
    }

    await bloodBank.save();

    // Check if stock has fallen below lowStockThreshold
    if (numericUnits < bloodBank.lowStockThreshold) {
      const io = req.app.get('io');
      const onlineUsers = req.app.get('onlineUsers') || {};
      const bankSocketId = onlineUsers[bloodBank._id.toString()];

      if (bankSocketId && io) {
        io.to(bankSocketId).emit('inventory:low', {
          bloodGroup,
          units: numericUnits,
          lowStockThreshold: bloodBank.lowStockThreshold,
        });
        console.log(`Low stock socket warning triggered for ${bloodBank.name}: ${bloodGroup} -> ${numericUnits} units`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      inventory: bloodBank.inventory,
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ success: false, message: 'Server error updating inventory stock' });
  }
};

// @desc    Log a new donation and update stock count
// @route   POST /api/bloodbank/me/donations
// @access  Private
exports.logDonation = async (req, res) => {
  try {
    const { donorEmail, donorPhone, bloodGroup, units } = req.body;

    if (!bloodGroup || !units) {
      return res.status(400).json({ success: false, message: 'Blood group and units count are required' });
    }

    const bloodBank = await BloodBank.findById(req.user._id);
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: 'Blood bank not found' });
    }

    // Verify blood group is valid
    if (!BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({ success: false, message: 'Invalid blood group type' });
    }

    // Try finding matching user in DB to link
    let donor = null;
    if (donorEmail) {
      donor = await User.findOne({ email: donorEmail.trim().toLowerCase(), role: 'donor' });
    }
    if (!donor && donorPhone) {
      donor = await User.findOne({ phone: donorPhone.trim(), role: 'donor' });
    }

    const quantity = parseInt(units);

    // Create donation record
    const donation = await Donation.create({
      donorId: donor ? donor._id : undefined,
      bloodBankId: bloodBank._id,
      bloodGroup,
      units: quantity,
      donatedAt: new Date(),
    });

    // Update inventory - increment stock units
    const itemIndex = bloodBank.inventory.findIndex((item) => item.bloodGroup === bloodGroup);
    if (itemIndex > -1) {
      bloodBank.inventory[itemIndex].units += quantity;
      bloodBank.inventory[itemIndex].lastUpdated = new Date();
    } else {
      bloodBank.inventory.push({
        bloodGroup,
        units: quantity,
        lastUpdated: new Date(),
      });
    }

    await bloodBank.save();

    res.status(201).json({
      success: true,
      message: 'Donation logged and inventory updated successfully',
      data: donation,
      inventory: bloodBank.inventory,
    });
  } catch (error) {
    console.error('Log donation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error logging donation' });
  }
};

// @desc    Get donation history
// @route   GET /api/bloodbank/me/donations
// @access  Private
exports.getDonationHistory = async (req, res) => {
  try {
    const donations = await Donation.find({ bloodBankId: req.user._id })
      .populate('donorId', 'name email phone')
      .sort({ donatedAt: -1 });

    res.status(200).json({
      success: true,
      data: donations,
    });
  } catch (error) {
    console.error('Get donation history error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving donation history' });
  }
};

// @desc    Search nearby blood banks with matching blood group in stock
// @route   GET /api/bloodbank/search
// @access  Public
exports.searchBloodBanks = async (req, res) => {
  try {
    const { bloodGroup, lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Location latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseFloat(radius) || 10; // default 10km

    const queryFilter = {
      isVerified: true,
    };

    if (bloodGroup) {
      queryFilter['inventory'] = {
        $elemMatch: {
          bloodGroup: bloodGroup,
          units: { $gt: 0 },
        },
      };
    }

    const banks = await BloodBank.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          distanceField: 'distanceInMeters',
          maxDistance: searchRadius * 1000,
          query: queryFilter,
          spherical: true,
        },
      },
      {
        $project: {
          password: 0,
          __v: 0,
        },
      },
      {
        $addFields: {
          distance: { $round: [{ $divide: ['$distanceInMeters', 1000] }, 2] }, // distance in km rounded to 2 decimals
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: banks.length,
      data: banks,
    });
  } catch (error) {
    console.error('Search blood banks error:', error);
    res.status(500).json({ success: false, message: 'Server error searching for blood banks' });
  }
};

// @desc    Get details of a single blood bank by ID
// @route   GET /api/bloodbank/:id
// @access  Public
exports.getBloodBankById = async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id).select('-password');

    if (!bloodBank) {
      return res.status(404).json({ success: false, message: 'Blood bank not found' });
    }

    res.status(200).json({
      success: true,
      data: bloodBank,
    });
  } catch (error) {
    console.error('Get blood bank details error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving blood bank details' });
  }
};
