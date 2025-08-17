import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
// mongoose import removed as it's not used
import connectDB from './shared/config/database';
import { applySecurityMiddleware } from './shared/middleware/security';
import adminRoutes from './admin/routes/index.route';
import clientRoutes from './client/routes/index.route';
import { authRoutes, uploadRoutes } from './shared/routes';

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);

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
