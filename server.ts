import app, { 
  gracefulShutdown, 
  unhandledRejectionHandler, 
  uncaughtExceptionHandler 
} from './src/app';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server function
const startServer = async () => {
  try {
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_database'}`);
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