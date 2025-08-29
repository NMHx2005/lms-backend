import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Disable Mongoose buffering globally to fail fast if not connected
mongoose.set('bufferCommands', false);

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_database';

// MongoDB connection options
const mongoOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 20000, // Try server selection for up to 20 seconds (increase to handle cold starts)
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  // Note: bufferCommands is not a valid connect option; use mongoose.set above
  autoIndex: process.env.NODE_ENV === 'development', // Build indexes in development
} as const;

// MongoDB connection function
export const connectDB = async (): Promise<void> => {
  try {
    // console.log('🔄 Connecting to MongoDB...');

    const conn = await mongoose.connect(MONGODB_URI, mongoOptions);

    // console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    // console.log(`🔌 Port: ${conn.connection.port}`);

    // Handle connection events
    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('🛑 Received SIGINT, closing MongoDB connection...');
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (error) {
    return false;
  }
};

// Get database stats
export const getDBStats = async () => {
  try {
    if (!mongoose.connection.db) {
      return null;
    }
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
    };
  } catch (error) {
    console.error('Error getting DB stats:', error);
    return null;
  }
};

export default connectDB;
