import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
// mongoose import removed as it's not used
import connectDB from './shared/config/database';
import { applySecurityMiddleware } from './shared/middleware/security';
import adminRoutes from './admin/routes/index.route';
import clientRoutes from './client/routes/index.route';
import { authRoutes, uploadRoutes, paymentsRoutes, cartRoutes } from './shared/routes';
import crypto from 'crypto';

// Import error handling middleware
import {
  requestIdMiddleware,
  globalErrorHandler,
  notFoundHandler,
  gracefulShutdown,
  unhandledRejectionHandler,
  uncaughtExceptionHandler
} from './shared/middleware/errorHandler';

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Apply all security middleware
applySecurityMiddleware(app);

// Basic middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Home route - Project information
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Learning Management System (LMS) Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    documentation: {
      apiDocs: '/api/docs',
      healthCheck: '/health',
      adminAPI: '/api/admin',
      clientAPI: '/api/client',
      authAPI: '/api/auth'
    },
    features: [
      'User Authentication & Authorization',
      'Role-Based Access Control (RBAC)',
      'Course Management',
      'File Upload & Management',
      'Real-time Notifications',
      'Analytics & Reporting',
      'Payment Integration',
      'Security & Rate Limiting'
    ],
    technologies: [
      'Node.js & Express.js',
      'TypeScript',
      'MongoDB & Mongoose',
      'JWT Authentication',
      'Multer & Cloudinary',
      'Helmet Security',
      'Rate Limiting',
      'CORS & Validation'
    ],
    author: 'LMS Development Team',
    repository: 'https://github.com/your-org/lms-backend',
    license: 'MIT'
  });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LMS Backend is healthy and running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: 'connected',
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version
  });
});

// API status endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'LMS Backend API Status',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      client: '/api/client',
      upload: '/api/upload'
    },
    authentication: 'JWT-based with refresh tokens',
    rateLimiting: 'enabled',
    security: 'enabled'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/cart', cartRoutes);


// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// Export app for server.ts to use
export default app;

// Export error handling functions for server.ts
export {
  gracefulShutdown,
  unhandledRejectionHandler,
  uncaughtExceptionHandler
};
