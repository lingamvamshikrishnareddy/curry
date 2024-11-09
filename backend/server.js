const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Route imports
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');
const socketAuthMiddleware = require('./middleware/socketAuthMiddleware');

// Load environment variables
dotenv.config();

// Initialize express app and server
const app = express();
const server = http.createServer(app);

// Security and optimization middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// MongoDB connection with retry logic
const connectDB = async () => {
    const retryInterval = 5000; // 5 seconds
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            console.log('Connected to MongoDB');
            break;
        } catch (err) {
            retries++;
            console.error(`MongoDB connection attempt ${retries} failed:`, err.message);
            if (retries === maxRetries) {
                console.error('Failed to connect to MongoDB after maximum retries');
                process.exit(1);
            }
            await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
    }
};

connectDB();

// Socket.io setup with error handling
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id}, Reason: ${reason}`);
    });
});

// Attach io to req object with connection tracking
let activeConnections = 0;
app.use((req, res, next) => {
    req.io = io;
    activeConnections++;
    res.on('finish', () => {
        activeConnections--;
    });
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/location', locationRoutes);

// Enhanced error logging middleware
app.use((err, req, res, next) => {
    const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
            code: err.code,
            status: err.status
        },
        request: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: process.env.NODE_ENV === 'development' ? req.body : undefined,
            ip: req.ip,
            headers: req.headers
        },
        user: req.user ? { id: req.user.id } : null
    };
    
    console.error('Error occurred:', errorLog);
    next(err);
});

// Error handling middleware
app.use(errorHandler);

// 404 handler with detailed logging
app.use('*', (req, res) => {
    console.log({
        timestamp: new Date().toISOString(),
        type: '404_ERROR',
        method: req.method,
        url: req.url,
        headers: req.headers,
        ip: req.ip
    });
    res.status(404).json({ message: 'Route not found' });
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
    console.log(`${signal} received. Starting graceful shutdown...`);
    
    // Close Socket.IO connections
    io.close(() => {
        console.log('Socket.IO server closed');
    });

    // Close HTTP server
    server.close(() => {
        console.log('HTTP server closed');
    });

    // Close MongoDB connection
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
    }

    // Exit process
    process.exit(0);
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = server;
