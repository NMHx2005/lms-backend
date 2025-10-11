const mongoose = require('mongoose');
require('dotenv').config();

// Import Course model
const CourseSchema = require('../dist/src/shared/models/core/Course.js').default;
const Course = mongoose.model('Course', CourseSchema);

async function checkCourseStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
    console.log('✅ Connected to MongoDB');

    // Find all courses and check their status
    const courses = await Course.find({}).select('_id title status isPublished isApproved submittedForReview submittedAt hasUnsavedChanges');
    
    console.log(`\n📊 Found ${courses.length} courses:`);
    console.log('=' .repeat(80));
    
    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      console.log(`   ID: ${course._id}`);
      console.log(`   Status: ${course.status || 'UNDEFINED'}`);
      console.log(`   isPublished: ${course.isPublished}`);
      console.log(`   isApproved: ${course.isApproved}`);
      console.log(`   submittedForReview: ${course.submittedForReview}`);
      console.log(`   submittedAt: ${course.submittedAt || 'null'}`);
      console.log(`   hasUnsavedChanges: ${course.hasUnsavedChanges}`);
      console.log('   ' + '-'.repeat(50));
    });

    // Count by status
    const statusCounts = {};
    courses.forEach(course => {
      const status = course.status || 'UNDEFINED';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📈 Status Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} courses`);
    });

    // Check for courses without status field
    const coursesWithoutStatus = courses.filter(course => !course.status);
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
