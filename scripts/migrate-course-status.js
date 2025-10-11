/**
 * Migration Script: Add status field to existing courses
 * 
 * This script updates courses that don't have a status field
 * and sets appropriate status based on isPublished and isApproved flags
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_database';

async function migrateCourseStatus() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Course = mongoose.connection.collection('courses');

    // Find courses without status field or with null status
    const coursesWithoutStatus = await Course.find({
      $or: [
        { status: { $exists: false } },
        { status: null }
      ]
    }).toArray();

    console.log(`📊 Found ${coursesWithoutStatus.length} courses without status field`);

    if (coursesWithoutStatus.length === 0) {
      console.log('✅ All courses already have status field');
      await mongoose.connection.close();
      return;
    }

    let updated = 0;
    let errors = 0;

    for (const course of coursesWithoutStatus) {
      try {
        let newStatus = 'draft'; // Default

        // Determine status based on existing flags
        if (course.isPublished && course.isApproved) {
          newStatus = 'published';
        } else if (course.isApproved && !course.isPublished) {
          newStatus = 'approved';
        } else if (course.isPublished && !course.isApproved) {
          // Submitted for review (published but not approved)
          newStatus = 'submitted';
        } else if (!course.isPublished && !course.isApproved) {
          newStatus = 'draft';
        }

        const updateData = {
          status: newStatus,
          updatedAt: new Date()
        };

        // Add submittedForReview flag if submitted
        if (newStatus === 'submitted') {
          updateData.submittedForReview = true;
          if (!course.submittedAt) {
            updateData.submittedAt = course.createdAt || new Date();
          }
        }

        await Course.updateOne(
          { _id: course._id },
          { $set: updateData }
        );

        updated++;
        console.log(`✅ Updated course: ${course.title} → ${newStatus}`);
      } catch (error) {
        errors++;
        console.error(`❌ Error updating course ${course._id}:`, error.message);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Successfully updated: ${updated} courses`);
    console.log(`   ❌ Errors: ${errors} courses`);
    console.log(`   📊 Total processed: ${coursesWithoutStatus.length} courses`);

    await mongoose.connection.close();
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateCourseStatus();
