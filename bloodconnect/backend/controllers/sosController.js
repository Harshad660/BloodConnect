const SOSRequest = require('../models/SOSRequest');
const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

// Helper to send fallback email
const sendFallbackEmail = async (to, subject, text) => {
  try {
    let transporter;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'mock_email_user@example.com') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      // Mock/test JSON transport (logs to terminal console)
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }

    const mailOptions = {
      from: '"BloodConnect SOS" <sos@bloodconnect.org>',
      to,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    if (transporter.options.jsonTransport) {
      console.log(`\n================ MOCK EMAIL SENT ================`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${text}`);
      console.log(`=================================================\n`);
    } else {
      console.log(`Email sent to ${to}: ${info.messageId}`);
    }
    return true;
  } catch (error) {
    console.error('Nodemailer error:', error.message);
    return false;
  }
};

// @desc    Create a new SOS request
// @route   POST /api/sos
// @access  Private (Requester role preferred, but allowed for all authenticated users)
exports.createSOS = async (req, res) => {
  try {
    const { bloodGroupNeeded, urgency, hospitalName, lat, lng, contactPhone, radius } = req.body;

    if (!bloodGroupNeeded || !urgency || !hospitalName || lat === undefined || lng === undefined || !contactPhone) {
      return res.status(400).json({ success: false, message: 'Please fill out all required fields' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseFloat(radius) || 10; // Default 10km radius

    // Find all users who have an active pending SOS request
    const activeSOS = await SOSRequest.find({ status: 'pending' }).select('requesterId');
    const excludedIds = activeSOS.map(r => r.requesterId.toString());
    
    // Also exclude the requester themselves
    if (!excludedIds.includes(req.user._id.toString())) {
      excludedIds.push(req.user._id.toString());
    }

    // 1. Find matching available donors within radius
    const matchingDonors = await User.find({
      role: 'donor',
      isAvailable: true,
      bloodGroup: bloodGroupNeeded,
      _id: { $nin: excludedIds },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: searchRadius * 1000, // in meters
        },
      },
    });

    // Find matching verified blood banks within radius that have stock
    const matchingBanks = await BloodBank.find({
      isVerified: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: searchRadius * 1000,
        },
      },
      inventory: {
        $elemMatch: {
          bloodGroup: bloodGroupNeeded,
          units: { $gt: 0 }
        }
      }
    });

    // 2. Prepare respondedDonors array
    const respondedDonors = matchingDonors.map((donor) => ({
      donorId: donor._id,
      status: 'pending',
    }));

    // 3. Create SOS request
    const sosRequest = await SOSRequest.create({
      requesterId: req.user._id,
      bloodGroupNeeded,
      urgency,
      hospitalName,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      contactPhone,
      status: 'pending',
      respondedDonors,
      bankOffers: [], // Initial empty offers
    });

    // Retrieve active sockets mapping from the Express app instance
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers') || {};

    // 4. Create notification records and notify each matching donor
    for (const donor of matchingDonors) {
      const message = `URGENT: ${bloodGroupNeeded} blood needed at ${hospitalName} (${urgency} priority). Contact: ${contactPhone}`;

      // Create Notification in DB
      await Notification.create({
        userId: donor._id,
        sosRequestId: sosRequest._id,
        message,
        isRead: false,
      });

      const donorSocketId = onlineUsers[donor._id.toString()];
      if (donorSocketId && io) {
        // Donor is online, send real-time socket event
        io.to(donorSocketId).emit('sos:new', {
          _id: sosRequest._id,
          requester: {
            name: req.user.name,
            phone: req.user.phone,
          },
          bloodGroupNeeded,
          urgency,
          hospitalName,
          location: sosRequest.location,
          contactPhone,
          status: 'pending',
          createdAt: sosRequest.createdAt,
        });
        console.log(`Socket broadcasted SOS to donor: ${donor.name} (Socket ID: ${donorSocketId})`);
      } else {
        // Donor is offline, send fallback email
        const emailBody = `Hello ${donor.name},\n\nThere is an urgent emergency blood request near you.\n\nDetails:\n- Blood Needed: ${bloodGroupNeeded}\n- Hospital: ${hospitalName}\n- Urgency: ${urgency.toUpperCase()}\n- Contact: ${contactPhone}\n\nPlease log in to BloodConnect to accept or decline the request.\n\nBest regards,\nBloodConnect Team`;
        await sendFallbackEmail(donor.email, `Urgent SOS: ${bloodGroupNeeded} Required`, emailBody);
      }
    }

    // 5. Notify matching blood banks
    for (const bank of matchingBanks) {
      const message = `URGENT: Blood Bank Alert! ${bloodGroupNeeded} required at ${hospitalName}. Contact: ${contactPhone}`;

      // Create Notification in DB for Blood Bank
      await Notification.create({
        userId: bank._id,
        sosRequestId: sosRequest._id,
        message,
        isRead: false,
      });

      const bankSocketId = onlineUsers[bank._id.toString()];
      if (bankSocketId && io) {
        // Bank is online, send real-time socket event
        io.to(bankSocketId).emit('sos:bankAlert', {
          _id: sosRequest._id,
          requester: {
            name: req.user.name,
            phone: req.user.phone,
          },
          bloodGroupNeeded,
          urgency,
          hospitalName,
          location: sosRequest.location,
          contactPhone,
          status: 'pending',
          createdAt: sosRequest.createdAt,
        });
        console.log(`Socket broadcasted SOS to Blood Bank: ${bank.name} (Socket ID: ${bankSocketId})`);
      }
    }

    res.status(201).json({
      success: true,
      data: sosRequest,
      notifiedCount: matchingDonors.length,
      notifiedBanksCount: matchingBanks.length,
    });
  } catch (error) {
    console.error('Create SOS error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error creating SOS request' });
  }
};

// @desc    Get requester's past SOS requests history
// @route   GET /api/sos/my-requests
// @access  Private
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await SOSRequest.find({ requesterId: req.user._id })
      .populate('respondedDonors.donorId', 'name phone email bloodGroup')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving SOS history' });
  }
};

// @desc    Get donor's incoming SOS alerts
// @route   GET /api/sos/incoming
// @access  Private (Donor only)
exports.getIncomingSOS = async (req, res) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({ success: false, message: 'Only donors can access incoming SOS alerts' });
    }

    // Find SOS requests that include this donor in respondedDonors
    const incomingRequests = await SOSRequest.find({
      'respondedDonors.donorId': req.user._id,
    })
      .populate('requesterId', 'name email phone')
      .sort({ createdAt: -1 });

    // Format output to return SOS requests with user's specific response status extracted
    const formatted = incomingRequests.map((reqItem) => {
      const donorResponse = reqItem.respondedDonors.find(
        (rd) => rd.donorId.toString() === req.user._id.toString()
      );
      return {
        _id: reqItem._id,
        requester: reqItem.requesterId,
        bloodGroupNeeded: reqItem.bloodGroupNeeded,
        urgency: reqItem.urgency,
        hospitalName: reqItem.hospitalName,
        location: reqItem.location,
        contactPhone: reqItem.contactPhone,
        status: reqItem.status,
        createdAt: reqItem.createdAt,
        myResponseStatus: donorResponse ? donorResponse.status : 'pending',
      };
    });

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get incoming SOS error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving incoming SOS requests' });
  }
};

// @desc    Donor responds (accepts/declines) to an SOS request
// @route   PUT /api/sos/:id/respond
// @access  Private (Donor only)
exports.respondToSOS = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'declined'
    const sosId = req.params.id;

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'accepted' or 'declined'" });
    }

    const sosRequest = await SOSRequest.findById(sosId);
    if (!sosRequest) {
      return res.status(404).json({ success: false, message: 'SOS Request not found' });
    }

    // Find the donor's entry in respondedDonors array
    const donorIndex = sosRequest.respondedDonors.findIndex(
      (rd) => rd.donorId.toString() === req.user._id.toString()
    );

    if (donorIndex === -1) {
      return res.status(403).json({ success: false, message: 'You were not targeted for this SOS request' });
    }

    // Check if donor has already responded
    if (sosRequest.respondedDonors[donorIndex].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `You have already ${sosRequest.respondedDonors[donorIndex].status} this request`,
      });
    }

    // Update response status and timestamp
    sosRequest.respondedDonors[donorIndex].status = status;
    sosRequest.respondedDonors[donorIndex].respondedAt = new Date();

    // If accepted, we can optionally mark SOS status as fulfilled (or let requester mark it)
    // For now, let's keep the SOS pending until the requester updates it, or update SOS status if needed.
    // Let's keep it pending so other donors can also accept if needed, or update if user prefers. Let's keep SOS pending.
    await sosRequest.save();

    // Notify requester in real-time
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers') || {};
    const requesterSocketId = onlineUsers[sosRequest.requesterId.toString()];

    if (requesterSocketId && io) {
      io.to(requesterSocketId).emit('sos:response', {
        sosRequestId: sosRequest._id,
        donor: {
          _id: req.user._id,
          name: req.user.name,
          phone: req.user.phone,
          bloodGroup: req.user.bloodGroup,
        },
        status,
      });
      console.log(`Socket notified requester of response: from donor ${req.user.name} to requester room`);
    }

    // Mark corresponding notification as read
    await Notification.findOneAndUpdate(
      { userId: req.user._id, sosRequestId: sosRequest._id },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: `Successfully ${status} the SOS request`,
      data: sosRequest,
    });
  } catch (error) {
    console.error('Respond to SOS error:', error);
    res.status(500).json({ success: false, message: 'Error responding to SOS request' });
  }
};

// @desc    Get blood bank's incoming SOS alerts
// @route   GET /api/sos/bank-incoming
// @access  Private (Blood Bank only)
exports.getBankIncomingSOS = async (req, res) => {
  try {
    if (req.user.role !== 'bloodbank') {
      return res.status(403).json({ success: false, message: 'Only blood banks can access incoming SOS alerts' });
    }

    // Get groups in stock
    const availableGroups = req.user.inventory
      .filter((item) => item.units > 0)
      .map((item) => item.bloodGroup);

    // Find pending requests demanding blood groups we have in stock
    const incomingRequests = await SOSRequest.find({
      status: 'pending',
      bloodGroupNeeded: { $in: availableGroups },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [req.user.location.coordinates[0], req.user.location.coordinates[1]],
          },
          $maxDistance: 25000, // 25km radius
        },
      },
    }).populate('requesterId', 'name email phone');

    // Format output
    const formatted = incomingRequests.map((reqItem) => {
      const myOffer = reqItem.bankOffers.find(
        (o) => o.bloodBankId.toString() === req.user._id.toString()
      );
      return {
        _id: reqItem._id,
        requester: reqItem.requesterId,
        bloodGroupNeeded: reqItem.bloodGroupNeeded,
        urgency: reqItem.urgency,
        hospitalName: reqItem.hospitalName,
        location: reqItem.location,
        contactPhone: reqItem.contactPhone,
        status: reqItem.status,
        createdAt: reqItem.createdAt,
        myOfferStatus: myOffer ? myOffer.status : null,
        myOfferUnits: myOffer ? myOffer.unitsOffered : null,
      };
    });

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get bank incoming SOS error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving incoming SOS alerts' });
  }
};

// @desc    Blood bank offers units for an SOS request
// @route   PUT /api/sos/:id/bank-offer
// @access  Private (Blood Bank only)
exports.offerStockSOS = async (req, res) => {
  try {
    const { unitsOffered } = req.body;
    const sosId = req.params.id;

    if (req.user.role !== 'bloodbank') {
      return res.status(403).json({ success: false, message: 'Only blood banks can offer stock' });
    }

    if (!unitsOffered || parseInt(unitsOffered) <= 0) {
      return res.status(400).json({ success: false, message: 'Please specify a valid units count' });
    }

    const sosRequest = await SOSRequest.findById(sosId);
    if (!sosRequest) {
      return res.status(404).json({ success: false, message: 'SOS request not found' });
    }

    // Verify stock availability
    const groupInStock = req.user.inventory.find(
      (item) => item.bloodGroup === sosRequest.bloodGroupNeeded
    );

    if (!groupInStock || groupInStock.units < parseInt(unitsOffered)) {
      return res.status(400).json({ success: false, message: 'Insufficient stock in inventory for this request' });
    }

    // Check if this bank already offered stock
    const offerIndex = sosRequest.bankOffers.findIndex(
      (o) => o.bloodBankId.toString() === req.user._id.toString()
    );

    if (offerIndex > -1) {
      return res.status(400).json({ success: false, message: 'You have already offered stock for this request' });
    }

    // Push new offer
    sosRequest.bankOffers.push({
      bloodBankId: req.user._id,
      unitsOffered: parseInt(unitsOffered),
      status: 'pending',
      respondedAt: new Date(),
    });

    await sosRequest.save();

    // Socket notify requester
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers') || {};
    const requesterSocketId = onlineUsers[sosRequest.requesterId.toString()];

    if (requesterSocketId && io) {
      io.to(requesterSocketId).emit('sos:bankOffer', {
        sosRequestId: sosRequest._id,
        bloodBank: {
          _id: req.user._id,
          name: req.user.name,
          phone: req.user.phone,
        },
        unitsOffered: parseInt(unitsOffered),
        status: 'pending',
      });
      console.log(`Socket broadcasted bank stock offer from ${req.user.name} to requester`);
    }

    res.status(200).json({
      success: true,
      message: 'Stock offer submitted successfully',
      data: sosRequest,
    });
  } catch (error) {
    console.error('Offer stock SOS error:', error);
    res.status(500).json({ success: false, message: 'Error submitting stock offer' });
  }
};

// @desc    Requester responds (accepts/declines) to a blood bank's stock offer
// @route   PUT /api/sos/:id/bank-offer/:offerId/respond
// @access  Private (Requester only)
exports.respondToBankOffer = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'declined'
    const { id, offerId } = req.params;

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'accepted' or 'declined'" });
    }

    const sosRequest = await SOSRequest.findById(id);
    if (!sosRequest) {
      return res.status(404).json({ success: false, message: 'SOS request not found' });
    }

    // Verify requester ownership
    if (sosRequest.requesterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this offer' });
    }

    const offer = sosRequest.bankOffers.id(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Stock offer not found' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Offer has already been ${offer.status}` });
    }

    offer.status = status;
    offer.respondedAt = new Date();

    // If accepted, decrement stock units from blood bank's inventory
    if (status === 'accepted') {
      const bloodBank = await BloodBank.findById(offer.bloodBankId);
      if (bloodBank) {
        const itemIndex = bloodBank.inventory.findIndex(
          (item) => item.bloodGroup === sosRequest.bloodGroupNeeded
        );
        if (itemIndex > -1) {
          const finalStock = Math.max(0, bloodBank.inventory[itemIndex].units - offer.unitsOffered);
          bloodBank.inventory[itemIndex].units = finalStock;
          bloodBank.inventory[itemIndex].lastUpdated = new Date();
          await bloodBank.save();

          // Low-stock socket event check
          if (finalStock < bloodBank.lowStockThreshold) {
            const io = req.app.get('io');
            const onlineUsers = req.app.get('onlineUsers') || {};
            const bankSocketId = onlineUsers[bloodBank._id.toString()];
            if (bankSocketId && io) {
              io.to(bankSocketId).emit('inventory:low', {
                bloodGroup: sosRequest.bloodGroupNeeded,
                units: finalStock,
                lowStockThreshold: bloodBank.lowStockThreshold,
              });
            }
          }
        }
      }
    }

    await sosRequest.save();

    res.status(200).json({
      success: true,
      message: `Stock offer ${status} successfully`,
      data: sosRequest,
    });
  } catch (error) {
    console.error('Respond to bank offer error:', error);
    res.status(500).json({ success: false, message: 'Error processing response to stock offer' });
  }
};
