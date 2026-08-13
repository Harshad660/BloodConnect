const User = require('../models/User');
const SOSRequest = require('../models/SOSRequest');

// @desc    Search donors by blood group, location (radius in km), or city
// @route   GET /api/donors/search
// @access  Public
exports.searchDonors = async (req, res) => {
  try {
    const { bloodGroup, lat, lng, radius, city } = req.query;

    let donors = [];

    // Find all users who have an active pending SOS request
    const activeSOS = await SOSRequest.find({ status: 'pending' }).select('requesterId');
    const excludedIds = activeSOS.map(r => r.requesterId.toString());

    // If coordinates are provided, do geospatial query
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const searchRadius = parseFloat(radius) || 10; // Default radius: 10km

      const queryFilter = {
        role: 'donor',
        isAvailable: true,
        _id: { $nin: excludedIds },
      };

      if (bloodGroup) {
        queryFilter.bloodGroup = bloodGroup;
      }

      donors = await User.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude], // [lng, lat]
            },
            distanceField: 'distanceInMeters',
            maxDistance: searchRadius * 1000, // radius in meters
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
            distance: { $round: [{ $divide: ['$distanceInMeters', 1000] }, 2] }, // Convert to km, round to 2 decimals
          },
        },
      ]);
    } else {
      // Fallback: search by blood group and/or city/pincode
      const query = {
        role: 'donor',
        isAvailable: true,
        _id: { $nin: excludedIds },
      };

      if (bloodGroup) {
        query.bloodGroup = bloodGroup;
      }
      if (city) {
        query.city = new RegExp(city, 'i');
      }

      donors = await User.find(query).select('-password');
      // Map to add 0 or null distance
      donors = donors.map((d) => ({
        ...d.toObject(),
        distance: null,
      }));
    }

    res.status(200).json({
      success: true,
      count: donors.length,
      data: donors,
    });
  } catch (error) {
    console.error('Search donors error:', error);
    res.status(500).json({ success: false, message: 'Error searching for donors' });
  }
};

// @desc    Get donor by ID
// @route   GET /api/donors/:id
// @access  Public
exports.getDonorById = async (req, res) => {
  try {
    const donor = await User.findOne({ _id: req.params.id, role: 'donor' }).select('-password');

    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    res.status(200).json({
      success: true,
      data: donor,
    });
  } catch (error) {
    console.error('Get donor error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving donor details' });
  }
};
