/**
 * Script to check course details
 * Run: node scripts/check-course.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function checkCourse() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const courseId = '68e42abf958c8e62df06e894';
    const userId = '68e1b364d9515910ae2f1ce4';

    const db = mongoose.connection.db;
    const course = await db.collection('courses').findOne({ 
      _id: new mongoose.Types.ObjectId(courseId) 
    });

    if (!course) {
      console.log('❌ Course not found in database');
    } else {
      console.log('\n📚 Course found:');
      console.log('  ID:', course._id);
      console.log('  Title:', course.title);
      console.log('  InstructorId:', course.instructorId);
      console.log('  InstructorId type:', typeof course.instructorId);
      console.log('  IsPublished:', course.isPublished);
      console.log('  IsApproved:', course.isApproved);
      console.log('  Status:', course.status);
      
      console.log('\n🔍 Comparison:');
      console.log('  UserId:', userId);
      console.log('  InstructorId:', course.instructorId?.toString());
      console.log('  Match:', course.instructorId?.toString() === userId);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCourse();

