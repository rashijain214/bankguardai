/**
 * BankGuard AI - Main Server Entry Point
 * 
 * This is the main entry point for the BankGuard AI backend server.
 * It sets up the Express application, middleware, routes, and WebSocket connections.
 * 
 * Features:
 * - RESTful API for fraud detection
 * - Real-time WebSocket connections for live updates
 * - Rate limiting and security middleware
 * - Comprehensive logging and error handling
 * - GDPR/DPDP compliant data processing
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { fraudDetectionRoutes } from './routes/fraudDetection';
import { userRoutes } from './routes/users';
import { alertRoutes } from './routes/alerts';
import { ragRoutes } from './routes/rag';
import { analyticsRoutes } from './routes/analytics';
import { setupWebSocket } from './services/websocket';
import { initializeRAGSystem } from './services/ragSystem';
import { startBackgroundJobs } from './services/backgroundJobs';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
app.use('/api/fraud', fraudDetectionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/analytics', analyticsRoutes);

// Protected routes (require authentication)
app.use('/api/admin', authMiddleware, (req, res) => {
  res.json({ message: 'Admin access granted', user: req.user });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Initialize services
async function initializeServer() {
  try {
    // Initialize RAG system for fraud pattern analysis
    await initializeRAGSystem();
    logger.info('RAG system initialized successfully');

    // Setup WebSocket connections for real-time updates
    setupWebSocket(io);
    logger.info('WebSocket server initialized');

    // Start background jobs for model updates and cleanup
    startBackgroundJobs();
    logger.info('Background jobs started');

    // Start the server
    server.listen(PORT, () => {
      logger.info(`BankGuard AI server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize and start the server
initializeServer();

export { app, io };