import app, {
  gracefulShutdown,
  unhandledRejectionHandler,
  uncaughtExceptionHandler
} from './src/app';
import dotenv from 'dotenv';
import connectDB from './src/shared/config/database';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server function
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    console.log('✅ Database connected successfully');

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Home: http://localhost:${PORT}/`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`📚 Admin API: http://localhost:${PORT}/api/admin`);
      console.log(`👤 Client API: http://localhost:${PORT}/api/client`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`📤 Upload API: http://localhost:${PORT}/api/upload`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => gracefulShutdown(server, 'SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown(server, 'SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections using centralized handler
process.on('unhandledRejection', unhandledRejectionHandler);
// Handle uncaught exceptions using centralized handler
process.on('uncaughtException', uncaughtExceptionHandler);
// Start the server
startServer();