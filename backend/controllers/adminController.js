const User = require('../models/User');
const SOSRequest = require('../models/SOSRequest');
const BloodBank = require('../models/BloodBank');

// @desc    Get all donors (admin only)
// @route   GET /api/admin/donors
// @access  Private/Admin
exports.getAllDonors = async (req, res) => {
  try {
    const donors = await User.find({ role: 'donor' }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donors.length,
      data: donors,
    });
  } catch (error) {
    console.error('Admin get donors error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving donors' });
  }
};

// @desc    Verify or toggle verification of a donor
// @route   PUT /api/admin/donors/:id/verify
// @access  Private/Admin
exports.verifyDonor = async (req, res) => {
  try {
    const { isVerified } = req.body;
    const donor = await User.findOne({ _id: req.params.id, role: 'donor' });

    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    donor.isVerified = isVerified !== undefined ? isVerified : !donor.isVerified;
    await donor.save();

    res.status(200).json({
      success: true,
      message: `Donor verification status set to ${donor.isVerified}`,
      data: donor,
    });
  } catch (error) {
    console.error('Admin verify donor error:', error);
    res.status(500).json({ success: false, message: 'Server error updating verification status' });
  }
};

// @desc    Delete a donor or user account
// @route   DELETE /api/admin/donors/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `User '${user.name}' successfully deleted`,
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting user' });
  }
};

// @desc    Get all SOS requests (admin only)
// @route   GET /api/admin/sos
// @access  Private/Admin
exports.getAllSOSRequests = async (req, res) => {
  try {
    const requests = await SOSRequest.find()
      .populate('requesterId', 'name email phone')
      .populate('respondedDonors.donorId', 'name phone email bloodGroup')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error('Admin get SOS requests error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving SOS requests' });
  }
};

// @desc    Get all blood banks (admin only)
// @route   GET /api/admin/bloodbanks
// @access  Private/Admin
exports.getAllBloodBanks = async (req, res) => {
  try {
    const bloodBanks = await BloodBank.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bloodBanks.length,
      data: bloodBanks,
    });
  } catch (error) {
    console.error('Admin get blood banks error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving blood banks' });
  }
};

// @desc    Verify or toggle verification of a blood bank
// @route   PUT /api/admin/bloodbanks/:id/verify
// @access  Private/Admin
exports.verifyBloodBank = async (req, res) => {
  try {
    const { isVerified } = req.body;
    const bank = await BloodBank.findById(req.params.id);

    if (!bank) {
      return res.status(404).json({ success: false, message: 'Blood bank not found' });
    }

    bank.isVerified = isVerified !== undefined ? isVerified : !bank.isVerified;
    await bank.save();

    res.status(200).json({
      success: true,
      message: `Blood bank verification status set to ${bank.isVerified}`,
      data: bank,
    });
  } catch (error) {
    console.error('Admin verify blood bank error:', error);
    res.status(500).json({ success: false, message: 'Server error updating verification status' });
  }
};

// @desc    Delete a blood bank account
// @route   DELETE /api/admin/bloodbanks/:id
// @access  Private/Admin
exports.deleteBloodBank = async (req, res) => {
  try {
    const bank = await BloodBank.findById(req.params.id);

    if (!bank) {
      return res.status(404).json({ success: false, message: 'Blood bank not found' });
    }

    await BloodBank.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Blood bank '${bank.name}' successfully deleted`,
    });
  } catch (error) {
    console.error('Admin delete blood bank error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting blood bank' });
  }
};

// @desc    Get all requesters (admin only)
// @route   GET /api/admin/requesters
// @access  Private/Admin
exports.getAllRequesters = async (req, res) => {
  try {
    const requesters = await User.find({ role: 'requester' }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requesters.length,
      data: requesters,
    });
  } catch (error) {
    console.error('Admin get requesters error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving requesters' });
  }
};

// @desc    Verify or toggle verification of a requester
// @route   PUT /api/admin/requesters/:id/verify
// @access  Private/Admin
exports.verifyRequester = async (req, res) => {
  try {
    const { isVerified } = req.body;
    const requester = await User.findOne({ _id: req.params.id, role: 'requester' });

    if (!requester) {
      return res.status(404).json({ success: false, message: 'Requester not found' });
    }

    requester.isVerified = isVerified !== undefined ? isVerified : !requester.isVerified;
    await requester.save();

    res.status(200).json({
      success: true,
      message: `Requester verification status set to ${requester.isVerified}`,
      data: requester,
    });
  } catch (error) {
    console.error('Admin verify requester error:', error);
    res.status(500).json({ success: false, message: 'Server error updating verification status' });
  }
};
