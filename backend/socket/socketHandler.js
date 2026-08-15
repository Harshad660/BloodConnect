const jwt = require('jsonwebtoken');
const SOSRequest = require('../models/SOSRequest');
const User = require('../models/User');

const socketHandler = (io, app) => {
  const onlineUsers = {}; // Map of userId -> socket.id
  app.set('onlineUsers', onlineUsers);

  // Auth middleware for sockets
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bloodconnect_super_secret_key_12345');
        socket.userId = decoded.id;

        // Fetch user or bloodbank to get role
        let account = await User.findById(decoded.id).select('role name');
        if (!account) {
          const BloodBank = require('../models/BloodBank');
          account = await BloodBank.findById(decoded.id).select('role name');
        }
        if (account) {
          socket.userRole = account.role;
          socket.userName = account.name;
        }
      } catch (err) {
        console.error('Socket authentication error:', err.message);
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Automatically join user-specific room and role room if authenticated
    if (socket.userId) {
      onlineUsers[socket.userId] = socket.id;
      socket.join(`user:${socket.userId}`);
      if (socket.userRole) {
        socket.join(`role:${socket.userRole}`);
      }
      console.log(`Socket ${socket.id} joined user:${socket.userId} and role:${socket.userRole}`);
    }

    // Explicit join event fallback / room setup
    socket.on('join', async (userData) => {
      let userId = typeof userData === 'object' ? userData.userId : userData;
      let role = typeof userData === 'object' ? userData.role : null;

      if (userId) {
        onlineUsers[userId] = socket.id;
        socket.userId = userId;
        socket.join(`user:${userId}`);

        if (!role) {
          let userAccount = await User.findById(userId).select('role name');
          if (!userAccount) {
            const BloodBank = require('../models/BloodBank');
            userAccount = await BloodBank.findById(userId).select('role name');
          }
          if (userAccount) {
            role = userAccount.role;
          }
        }

        if (role) {
          socket.userRole = role;
          socket.join(`role:${role}`);
          console.log(`User ${userId} joined room role:${role}`);
        }
      }
    });

    // Donor responds to SOS via Socket
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

        const sosRequest = await SOSRequest.findById(sosRequestId).populate('requesterId', 'name email phone');
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

        const payload = {
          sosRequestId: sosRequest._id,
          donor: {
            _id: donor._id,
            name: donor.name,
            phone: donor.phone,
            bloodGroup: donor.bloodGroup,
          },
          status,
          updatedAt: new Date(),
        };

        // Notify requester directly in their user room
        const requesterId = sosRequest.requesterId._id ? sosRequest.requesterId._id.toString() : sosRequest.requesterId.toString();
        io.to(`user:${requesterId}`).emit('sos:response', payload);

        // Also broadcast response update to admin room
        io.to('role:admin').emit('sos:admin_update', {
          sosRequestId: sosRequest._id,
          responderName: donor.name,
          responderRole: 'donor',
          status,
          updatedAt: new Date(),
        });

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

        const payload = {
          sosRequestId: sosRequest._id,
          bloodBank: {
            _id: bloodBank._id,
            name: bloodBank.name,
            phone: bloodBank.phone,
          },
          unitsOffered: parseInt(unitsOffered),
          status: 'pending',
          updatedAt: new Date(),
        };

        // Notify requester room
        const requesterId = sosRequest.requesterId.toString();
        io.to(`user:${requesterId}`).emit('sos:bankOffer', payload);

        // Notify admin room
        io.to('role:admin').emit('sos:admin_update', {
          sosRequestId: sosRequest._id,
          responderName: bloodBank.name,
          responderRole: 'bloodbank',
          status: `offered ${unitsOffered} units`,
          updatedAt: new Date(),
        });

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
