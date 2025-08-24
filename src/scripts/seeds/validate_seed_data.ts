import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import User from '../../shared/models/core/User';
import Course from '../../shared/models/core/Course';
import Section from '../../shared/models/core/Section';
import Lesson from '../../shared/models/core/Lesson';
import Enrollment from '../../shared/models/core/Enrollment';
import Payment from '../../shared/models/payment/Payment';
import Order from '../../shared/models/payment/Order';
import Certificate from '../../shared/models/core/Certificate';
import TeacherRating from '../../shared/models/core/TeacherRating';
import Comment from '../../shared/models/core/Comment';
import CourseReview from '../../shared/models/core/CourseReview';
import Assignment from '../../shared/models/core/Assignment';

// Validation functions
async function validateUserData() {
  console.log('🔍 Validating User Data...');
  
  const users = await User.find({});
  console.log(`✅ Found ${users.length} users`);
  
  // Check role distribution
  const adminUsers = users.filter(u => u.role === 'admin');
  const teacherUsers = users.filter(u => u.role === 'teacher');
  const studentUsers = users.filter(u => u.role === 'student');
  
  console.log(`- Admin users: ${adminUsers.length}`);
  console.log(`- Teacher users: ${teacherUsers.length}`);
  console.log(`- Student users: ${studentUsers.length}`);
  
  // Validate required fields
  const invalidUsers = users.filter(u => !u.email || !u.name || !u.role);
  if (invalidUsers.length > 0) {
    console.error(`❌ Found ${invalidUsers.length} users with missing required fields`);
    return false;
  }
  
  console.log('✅ User data validation passed');
  return true;
}

async function validateCourseData() {
  console.log('🔍 Validating Course Data...');
  
  const courses = await Course.find({});
  console.log(`✅ Found ${courses.length} courses`);
  
  // Check required fields
  const invalidCourses = courses.filter(c => 
    !c.title || !c.description || !c.instructorId || !c.price
  );
  if (invalidCourses.length > 0) {
    console.error(`❌ Found ${invalidCourses.length} courses with missing required fields`);
    return false;
  }
  
  // Check instructor relationships
  const users = await User.find({ role: 'teacher' });
  const teacherIds = users.map(u => u._id.toString());
  
  const coursesWithInvalidInstructors = courses.filter(c => 
    !teacherIds.includes(c.instructorId.toString())
  );
  
  if (coursesWithInvalidInstructors.length > 0) {
    console.error(`❌ Found ${coursesWithInvalidInstructors.length} courses with invalid instructors`);
    return false;
  }
  
  console.log('✅ Course data validation passed');
  return true;
}

async function validateEnrollmentData() {
  console.log('🔍 Validating Enrollment Data...');
  
  const enrollments = await Enrollment.find({});
  console.log(`✅ Found ${enrollments.length} enrollments`);
  
  // Check required fields
  const invalidEnrollments = enrollments.filter(e => 
    !e.studentId || !e.courseId || !e.instructorId
  );
  if (invalidEnrollments.length > 0) {
    console.error(`❌ Found ${invalidEnrollments.length} enrollments with missing required fields`);
    return false;
  }
  
  // Check student relationships
  const students = await User.find({ role: 'student' });
  const studentIds = students.map(u => u._id.toString());
  
  const enrollmentsWithInvalidStudents = enrollments.filter(e => 
    !studentIds.includes(e.studentId.toString())
  );
  
  if (enrollmentsWithInvalidStudents.length > 0) {
    console.error(`❌ Found ${enrollmentsWithInvalidStudents.length} enrollments with invalid students`);
    return false;
  }
  
  // Check course relationships
  const courses = await Course.find({});
  const courseIds = courses.map(c => c._id.toString());
  
  const enrollmentsWithInvalidCourses = enrollments.filter(e => 
    !courseIds.includes(e.courseId.toString())
  );
  
  if (enrollmentsWithInvalidCourses.length > 0) {
    console.error(`❌ Found ${enrollmentsWithInvalidCourses.length} enrollments with invalid courses`);
    return false;
  }
  
  // Check completion logic
  const completedEnrollments = enrollments.filter(e => e.isCompleted);
  const enrollmentsWithCompletionDate = enrollments.filter(e => e.completedAt);
  
  console.log(`- Completed enrollments: ${completedEnrollments.length}`);
  console.log(`- Enrollments with completion date: ${enrollmentsWithCompletionDate.length}`);
  
  // All completed enrollments should have completion date
  const completedWithoutDate = completedEnrollments.filter(e => !e.completedAt);
  if (completedWithoutDate.length > 0) {
    console.error(`❌ Found ${completedWithoutDate.length} completed enrollments without completion date`);
    return false;
  }
  
  console.log('✅ Enrollment data validation passed');
  return true;
}

async function validateCommentData() {
  console.log('🔍 Validating Comment Data...');
  
  const comments = await Comment.find({});
  console.log(`✅ Found ${comments.length} comments`);
  
  // Check required fields
  const invalidComments = comments.filter(c => 
    !c.commentId || !c.content || !c.authorId || !c.contentType || !c.contentId
  );
  if (invalidComments.length > 0) {
    console.error(`❌ Found ${invalidComments.length} comments with missing required fields`);
    return false;
  }
  
  // Check author relationships
  const users = await User.find({});
  const userIds = users.map(u => u._id.toString());
  
  const commentsWithInvalidAuthors = comments.filter(c => 
    !userIds.includes(c.authorId.toString())
  );
  
  if (commentsWithInvalidAuthors.length > 0) {
    console.error(`❌ Found ${commentsWithInvalidAuthors.length} comments with invalid authors`);
    return false;
  }
  
  console.log('✅ Comment data validation passed');
  return true;
}

async function validateCertificateData() {
  console.log('🔍 Validating Certificate Data...');
  
  const certificates = await Certificate.find({});
  console.log(`✅ Found ${certificates.length} certificates`);
  
  // Check required fields
  const invalidCertificates = certificates.filter(c => 
    !c.certificateId || !c.verificationCode || !c.courseId || !c.studentId || !c.instructorId
  );
  if (invalidCertificates.length > 0) {
    console.error(`❌ Found ${invalidCertificates.length} certificates with missing required fields`);
    return false;
  }
  
  // Check relationships
  const courses = await Course.find({});
  const courseIds = courses.map(c => c._id.toString());
  
  const certificatesWithInvalidCourses = certificates.filter(c => 
    !courseIds.includes(c.courseId.toString())
  );
  
  if (certificatesWithInvalidCourses.length > 0) {
    console.error(`❌ Found ${certificatesWithInvalidCourses.length} certificates with invalid courses`);
    return false;
  }
  
  console.log('✅ Certificate data validation passed');
  return true;
}

async function validateRelationships() {
  console.log('🔍 Validating Overall Relationships...');
  
  // Check enrollment-course-instructor consistency
  const enrollments = await Enrollment.find({}).populate('courseId');
  const inconsistentEnrollments = enrollments.filter(e => {
    const course = e.courseId as any;
    return !course.instructorId.equals(e.instructorId);
  });
  
  if (inconsistentEnrollments.length > 0) {
    console.error(`❌ Found ${inconsistentEnrollments.length} enrollments with inconsistent instructor-course relationships`);
    return false;
  }
  
  // Check certificate-enrollment consistency
  const certificates = await Certificate.find({});
  const enrollmentsForCertificates = await Enrollment.find({ isCompleted: true });
  
  if (certificates.length !== enrollmentsForCertificates.length) {
    console.error(`❌ Certificate count (${certificates.length}) doesn't match completed enrollments (${enrollmentsForCertificates.length})`);
    return false;
  }
  
  console.log('✅ Relationship validation passed');
  return true;
}

// Main validation function
async function validateSeedData() {
  try {
    console.log('🚀 Starting Seed Data Validation...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
    console.log('✅ Connected to MongoDB');
    
    // Run all validations
    const results = await Promise.all([
      validateUserData(),
      validateCourseData(),
      validateEnrollmentData(),
      validateCommentData(),
      validateCertificateData(),
      validateRelationships()
    ]);
    
    const allPassed = results.every(result => result === true);
    
    if (allPassed) {
      console.log('\n🎉 All validations passed! Seed data is consistent and logical.');
    } else {
      console.log('\n❌ Some validations failed. Please check the errors above.');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Validation error:', error);
    return false;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run validation if called directly
if (require.main === module) {
  validateSeedData()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

export default validateSeedData;
