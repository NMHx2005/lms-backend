import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { testConnection, getDBStats } from '../config/database';

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_database';

const testMongoConnection = async () => {
  try {
    console.log('🔄 Testing MongoDB connection...');
    console.log(`🔗 URI: ${MONGODB_URI}`);

    // Test connection
    const isConnected = await testConnection();

    if (isConnected) {
      console.log('✅ MongoDB connection successful!');

      // Get database stats
      const stats = await getDBStats();
      if (stats) {
        console.log('📊 Database Statistics:');
        console.log(`   Collections: ${stats.collections}`);
        console.log(
          `   Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`
        );
        console.log(
          `   Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`
        );
        console.log(`   Indexes: ${stats.indexes}`);
        console.log(
          `   Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`
        );
      }

      // Test basic operations
      console.log('🧪 Testing basic operations...');

      // Test User model
      const User = mongoose.model('User');
      const userCount = await User.countDocuments();
      console.log(`   Users in database: ${userCount}`);

      // Test Course model
      const Course = mongoose.model('Course');
      const courseCount = await Course.countDocuments();
      console.log(`   Courses in database: ${courseCount}`);

      console.log('✅ All tests passed!');
    } else {
      console.log('❌ MongoDB connection failed!');
    }
  } catch (error) {
    console.error('❌ Error testing connection:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testMongoConnection();
}

export default testMongoConnection;
