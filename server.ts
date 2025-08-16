import app from './src/app';
import dotenv from 'dotenv';
import { connectDB } from './src/config/database';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_database'}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
startServer();