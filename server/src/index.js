import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Config
dotenv.config();
import { connectDB } from './config/db.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';
import { setSocketIO } from './services/notificationService.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import counterRoutes from './routes/counterRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import cadRoutes from './routes/cadRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';

const app = express();
const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});
setSocketIO(io);
setupSocketHandlers(io);

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static directory for uploaded supporting docs
const uploadDir = path.resolve('uploads');
app.use('/uploads', express.static(uploadDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'QueueEase API Server',
    tagline: 'Skip the Wait, Manage Your Campus Services Smartly.',
    timestamp: new Date(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/cad', cadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);

// Serve static frontend build if present (for single-service deployment like Render / Railway)
const clientDistPath = path.resolve('client', 'dist');
app.use(express.static(clientDistPath));

// Fallback for Single Page Application routing (non-API routes)
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// 404 handler for API routes
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found on QueueEase server.` });
});

// Centralized error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 QueueEase Backend Server listening on port ${PORT}`);
      console.log(`📡 Real-time Socket.io initialized`);
      console.log(`🔗 Health check available at: http://localhost:${PORT}/api/health`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('Failed to start QueueEase server:', error);
  }
};

startServer();

export { app, server, io };

