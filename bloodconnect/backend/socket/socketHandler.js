const jwt = require('jsonwebtoken');
const SOSRequest = require('../models/SOSRequest');
const User = require('../models/User');

const socketHandler = (io, app) => {
  const onlineUsers = {}; // Map of userId -> socket.id
  app.set('onlineUsers', onlineUsers);

  // Auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bloodconnect_super_secret_key_12345');
        socket.userId = decoded.id;
      } catch (err) {
        console.error('Socket authentication error:', err.message);
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // If verified by token handshake
    if (socket.userId) {
      onlineUsers[socket.userId] = socket.id;
      console.log(`User registered via token handshake: User ID ${socket.userId} -> Socket ${socket.id}`);
    }

    // Manual registration fallback
    socket.on('join', (userId) => {
      if (userId) {
        onlineUsers[userId] = socket.id;
        socket.userId = userId;
        console.log(`User registered via join event: User ID ${userId} -> Socket ${socket.id}`);
      }
    });

    // Donor responds to SOS via Socket (Alternative to REST endpoint)
    socket.on('sos:respond', async (data) => {
      try {
        const { sosRequestId, status } = data; // status is 'accepted' or 'declined'
        const donorId = socket.userId;

        if (!donorId) {
          socket.emit('error', { message: 'Unauthorized socket client' });
          return;
        }

        if (!['accepted', 'declined'].includes(status)) {
          socket.emit('error', { message: "Status must be 'accepted' or 'declined'" });
          return;
        }

        const sosRequest = await SOSRequest.findById(sosRequestId);
        if (!sosRequest) {
          socket.emit('error', { message: 'SOS Request not found' });
          return;
        }

        const donor = await User.findById(donorId).select('name phone bloodGroup');
        if (!donor) {
          socket.emit('error', { message: 'Donor profile not found' });
          return;
        }

        const donorIndex = sosRequest.respondedDonors.findIndex(
          (rd) => rd.donorId.toString() === donorId.toString()
        );

        if (donorIndex === -1) {
          socket.emit('error', { message: 'You were not targeted for this SOS request' });
          return;
        }

        if (sosRequest.respondedDonors[donorIndex].status !== 'pending') {
          socket.emit('error', {
            message: `You have already ${sosRequest.respondedDonors[donorIndex].status} this request`,
          });
          return;
        }

        // Update response
        sosRequest.respondedDonors[donorIndex].status = status;
        sosRequest.respondedDonors[donorIndex].respondedAt = new Date();
        await sosRequest.save();

        // Notify requester via socket
        const requesterId = sosRequest.requesterId.toString();
        const requesterSocketId = onlineUsers[requesterId];

        if (requesterSocketId) {
          io.to(requesterSocketId).emit('sos:response', {
            sosRequestId: sosRequest._id,
            donor: {
              _id: donor._id,
              name: donor.name,
              phone: donor.phone,
              bloodGroup: donor.bloodGroup,
            },
            status,
          });
          console.log(`Notified requester (Socket ID: ${requesterSocketId}) of response: ${status} by donor ${donor.name}`);
        }

        // Acknowledge donor client
        socket.emit('sos:respond_success', {
          sosRequestId,
          status,
        });
      } catch (error) {
        console.error('Socket sos:respond error:', error);
        socket.emit('error', { message: 'Server error processing response' });
      }
    });

    // Blood bank offers stock via Socket
    socket.on('sos:offerStock', async (data) => {
      try {
        const { sosRequestId, unitsOffered } = data;
        const bloodBankId = socket.userId;

        if (!bloodBankId) {
          socket.emit('error', { message: 'Unauthorized socket client' });
          return;
        }

        const BloodBank = require('../models/BloodBank');
        const bloodBank = await BloodBank.findById(bloodBankId);
        if (!bloodBank) {
          socket.emit('error', { message: 'Blood bank profile not found' });
          return;
        }

        const SOSRequest = require('../models/SOSRequest');
        const sosRequest = await SOSRequest.findById(sosRequestId);
        if (!sosRequest) {
          socket.emit('error', { message: 'SOS request not found' });
          return;
        }

        // Verify stock
        const stockGroup = bloodBank.inventory.find(
          (item) => item.bloodGroup === sosRequest.bloodGroupNeeded
        );
        if (!stockGroup || stockGroup.units < parseInt(unitsOffered)) {
          socket.emit('error', { message: 'Insufficient stock in inventory' });
          return;
        }

        // Add offer if not already made
        const existingIndex = sosRequest.bankOffers.findIndex(
          (o) => o.bloodBankId.toString() === bloodBankId.toString()
        );

        if (existingIndex > -1) {
          socket.emit('error', { message: 'You have already offered stock for this request' });
          return;
        }

        sosRequest.bankOffers.push({
          bloodBankId,
          unitsOffered: parseInt(unitsOffered),
          status: 'pending',
          respondedAt: new Date(),
        });

        await sosRequest.save();

        // Notify requester via socket
        const requesterId = sosRequest.requesterId.toString();
        const requesterSocketId = onlineUsers[requesterId];

        if (requesterSocketId) {
          io.to(requesterSocketId).emit('sos:bankOffer', {
            sosRequestId: sosRequest._id,
            bloodBank: {
              _id: bloodBank._id,
              name: bloodBank.name,
              phone: bloodBank.phone,
            },
            unitsOffered: parseInt(unitsOffered),
            status: 'pending',
          });
          console.log(`Socket notified requester of stock offer from blood bank ${bloodBank.name}`);
        }

        // Acknowledge blood bank
        socket.emit('sos:offerStock_success', {
          sosRequestId,
          unitsOffered,
        });
      } catch (error) {
        console.error('Socket sos:offerStock error:', error);
        socket.emit('error', { message: 'Server error processing stock offer' });
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.userId && onlineUsers[socket.userId] === socket.id) {
        delete onlineUsers[socket.userId];
        console.log(`Removed User ID ${socket.userId} from online register`);
      }
    });
  });
};

module.exports = socketHandler;
