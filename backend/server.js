require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize Socket.io
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Set Socket.io instance on app
app.set('io', io);

// Initialize Socket Handler
const socketHandler = require('./socket/socketHandler');
socketHandler(io, app);

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/sos', require('./routes/sos'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bloodbank', require('./routes/bloodBank'));
app.use('/api/search', require('./routes/search'));

// Route alignment for /api/users/me
const userAuthRouter = express.Router();
const { getMe, updateMe } = require('./controllers/authController');
const { protect } = require('./middleware/auth');
userAuthRouter.get('/me', protect, getMe);
userAuthRouter.put('/me', protect, updateMe);
app.use('/api/users', userAuthRouter);

// Base Route
app.get('/', (req, res) => {
  res.send('BloodConnect API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});
