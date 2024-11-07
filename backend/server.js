const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');
const socketAuthMiddleware = require('./middleware/socketAuthMiddleware');
const locationRoutes = require('./routes/locationRoutes');
dotenv.config();
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(helmet());
app.use(compression());
app.use('/api/location', locationRoutes);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  startServer();
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  setTimeout(() => {
    startServer();
  }, 5000); // Wait 5 seconds before retrying
});

function startServer() {
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
io.use(socketAuthMiddleware);
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Attach io to req object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Improved error logging
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  next(err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/location', locationRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

const port = process.env.PORT || 0;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
    setTimeout(() => {
      server.close();
      server.listen(port, () => {
        const actualPort = server.address().port;
        console.log(`Server is running on port ${actualPort}`);
      });
    }, 2000); // Wait for 2 seconds before retrying
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

server.listen(port, () => {
  const actualPort = server.address().port;
  console.log(`Server is running on port ${actualPort}`);
});

module.exports = server;
