/**
 * Script to sync totalStudents field in Course model
 * Run this to fix courses with incorrect totalStudents count
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../dist/src/shared/models/core/Course').default;
const Enrollment = require('../dist/src/shared/models/core/Enrollment').default;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

async function syncTotalStudents() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all courses
    const courses = await Course.find({});
    console.log(`📚 Found ${courses.length} courses\n`);

    let updated = 0;
    let skipped = 0;

    for (const course of courses) {
      // Count actual enrollments
      const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id });
      
      // Get unique student IDs
      const uniqueStudents = await Enrollment.distinct('studentId', { courseId: course._id });
      const actualTotalStudents = uniqueStudents.length;

      if (course.totalStudents !== actualTotalStudents) {
        console.log(`📝 Course: ${course.title}`);
        console.log(`   Old totalStudents: ${course.totalStudents}`);
        console.log(`   New totalStudents: ${actualTotalStudents}`);
        console.log(`   Total enrollments: ${enrollmentCount}`);

        // Update course
        await Course.findByIdAndUpdate(course._id, {
          totalStudents: actualTotalStudents,
          enrolledStudents: uniqueStudents
        });

        updated++;
        console.log(`   ✅ Updated!\n`);
      } else {
        skipped++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updated} courses`);
    console.log(`⏭️  Skipped: ${skipped} courses (already correct)`);
    console.log(`📚 Total: ${courses.length} courses`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

syncTotalStudents();

