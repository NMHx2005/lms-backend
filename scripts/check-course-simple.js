const mongoose = require('mongoose');
require('dotenv').config();

async function checkCourseStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
    console.log('✅ Connected to MongoDB');

    // Get database
    const db = mongoose.connection.db;
    
    // Find specific course by ID
    const courseId = '68e6101cce7d9e2ccd1e79a0';
    const course = await db.collection('courses').findOne({ _id: new mongoose.Types.ObjectId(courseId) });
    
    if (course) {
      console.log(`\n📊 Course found: ${course.title}`);
      console.log('=' .repeat(80));
      console.log(`ID: ${course._id}`);
      console.log(`Status: ${course.status || 'UNDEFINED'}`);
      console.log(`isPublished: ${course.isPublished}`);
      console.log(`isApproved: ${course.isApproved}`);
      console.log(`submittedForReview: ${course.submittedForReview}`);
      console.log(`submittedAt: ${course.submittedAt || 'null'}`);
      console.log(`hasUnsavedChanges: ${course.hasUnsavedChanges}`);
      
      if (!course.status) {
        console.log('\n⚠️  WARNING: This course does not have a status field!');
        console.log('💡 Run migration script to fix this:');
        console.log('   node scripts/migrate-course-status.js');
      }
    } else {
      console.log(`❌ Course with ID ${courseId} not found`);
    }

    // Find all courses and check their status
    const allCourses = await db.collection('courses').find({}).toArray();
    
    console.log(`\n📊 Found ${allCourses.length} total courses:`);
    console.log('=' .repeat(80));
    
    allCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      console.log(`   ID: ${course._id}`);
      console.log(`   Status: ${course.status || 'UNDEFINED'}`);
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

    console.log('\n📈 Status Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} courses`);
    });

    // Check for courses without status field
    const coursesWithoutStatus = allCourses.filter(course => !course.status);
    if (coursesWithoutStatus.length > 0) {
      console.log(`\n⚠️  Found ${coursesWithoutStatus.length} courses without status field:`);
      coursesWithoutStatus.forEach(course => {
        console.log(`   - ${course.title} (ID: ${course._id})`);
      });
      console.log('\n💡 Run migration script to fix this:');
      console.log('   node scripts/migrate-course-status.js');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkCourseStatus();
