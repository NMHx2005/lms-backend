const mongoose = require('mongoose');
require('dotenv').config();

async function fixApprovedCourse() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
    console.log('✅ Connected to MongoDB');

    // Get database
    const db = mongoose.connection.db;
    
    // Find the approved course
    const courseId = '68e71ea805720c61b1ec1457';
    const course = await db.collection('courses').findOne({ 
      _id: new mongoose.Types.ObjectId(courseId) 
    });
    
    if (course) {
      console.log(`\n🔧 Fixing approved course: ${course.title}`);
      console.log(`   Current: status=${course.status}, isPublished=${course.isPublished}, isApproved=${course.isApproved}`);
      
      // Update to published
      const result = await db.collection('courses').updateOne(
        { _id: new mongoose.Types.ObjectId(courseId) },
        { 
          $set: { 
            status: 'published',
            isPublished: true,
            isApproved: true,
            publishedAt: new Date()
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Fixed course status to published`);
      } else {
        console.log(`⚠️  No changes made`);
      }
    } else {
      console.log(`❌ Course with ID ${courseId} not found`);
    }
    
    // Verify all courses status
    console.log('\n📊 Verifying all courses after fix...');
    const allCourses = await db.collection('courses').find({}).toArray();
    
    allCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      console.log(`   Status: ${course.status}`);
      console.log(`   isPublished: ${course.isPublished}`);
      console.log(`   isApproved: ${course.isApproved}`);
      console.log('   ' + '-'.repeat(50));
    });
    
    // Count by status
    const statusCounts = {};
    allCourses.forEach(course => {
      const status = course.status || 'UNDEFINED';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📈 Final Status Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} courses`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixApprovedCourse();
