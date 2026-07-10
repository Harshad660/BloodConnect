const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BloodBank = require('../models/BloodBank');

// @desc    Get both donors and blood banks in one call
// @route   GET /api/search/combined
// @access  Public
router.get('/combined', async (req, res) => {
  try {
    const { bloodGroup, lat, lng, radius, city } = req.query;

    let donors = [];
    let bloodBanks = [];

    const searchRadius = parseFloat(radius) || 10; // Default 10km

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      // 1. Search Donors
      const donorFilter = {
        role: 'donor',
        isAvailable: true,
      };
      if (bloodGroup) {
        donorFilter.bloodGroup = bloodGroup;
      }

      donors = await User.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            distanceField: 'distanceInMeters',
            maxDistance: searchRadius * 1000,
            query: donorFilter,
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
            distance: { $round: [{ $divide: ['$distanceInMeters', 1000] }, 2] },
          },
        },
      ]);

      // 2. Search Blood Banks
      const bankFilter = {
        isVerified: true,
      };
      if (bloodGroup) {
        bankFilter['inventory'] = {
          $elemMatch: {
            bloodGroup: bloodGroup,
            units: { $gt: 0 },
          },
        };
      }

      bloodBanks = await BloodBank.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            distanceField: 'distanceInMeters',
            maxDistance: searchRadius * 1000,
            query: bankFilter,
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
            distance: { $round: [{ $divide: ['$distanceInMeters', 1000] }, 2] },
          },
        },
      ]);
    } else {
      // Fallback/City search filter
      const donorQuery = {
        role: 'donor',
        isAvailable: true,
      };
      if (bloodGroup) {
        donorQuery.bloodGroup = bloodGroup;
      }
      if (city) {
        donorQuery.city = new RegExp(city, 'i');
      }

      donors = await User.find(donorQuery).select('-password');
      donors = donors.map((d) => ({
        ...d.toObject(),
        distance: null,
      }));

      const bankQuery = {
        isVerified: true,
      };
      if (bloodGroup) {
        bankQuery['inventory'] = {
          $elemMatch: {
            bloodGroup: bloodGroup,
            units: { $gt: 0 },
          },
        };
      }
      if (city) {
        bankQuery.city = new RegExp(city, 'i');
      }

      bloodBanks = await BloodBank.find(bankQuery).select('-password');
      bloodBanks = bloodBanks.map((b) => ({
        ...b.toObject(),
        distance: null,
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        donors,
        bloodBanks,
      },
    });
  } catch (error) {
    console.error('Combined search error:', error);
    res.status(500).json({ success: false, message: 'Server error during combined search' });
  }
});

module.exports = router;
