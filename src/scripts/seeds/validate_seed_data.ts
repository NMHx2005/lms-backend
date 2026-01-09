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

  const users = await User.find({});

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

    return false;
  }

  return true;
}

async function validateCourseData() {

  const courses = await Course.find({});

  // Check required fields
  const invalidCourses = courses.filter(c => 
    !c.title || !c.description || !c.instructorId || !c.price
  );
  if (invalidCourses.length > 0) {

    return false;
  }
  
  // Check instructor relationships
  const users = await User.find({ role: 'teacher' });
  const teacherIds = users.map(u => u._id.toString());
  
  const coursesWithInvalidInstructors = courses.filter(c => 
    !teacherIds.includes(c.instructorId.toString())
  );
  
  if (coursesWithInvalidInstructors.length > 0) {

    return false;
  }

  return true;
}

async function validateEnrollmentData() {

  const enrollments = await Enrollment.find({});

  // Check required fields
  const invalidEnrollments = enrollments.filter(e => 
    !e.studentId || !e.courseId || !e.instructorId
  );
  if (invalidEnrollments.length > 0) {

    return false;
  }
  
  // Check student relationships
  const students = await User.find({ role: 'student' });
  const studentIds = students.map(u => u._id.toString());
  
  const enrollmentsWithInvalidStudents = enrollments.filter(e => 
    !studentIds.includes(e.studentId.toString())
  );
  
  if (enrollmentsWithInvalidStudents.length > 0) {

    return false;
  }
  
  // Check course relationships
  const courses = await Course.find({});
  const courseIds = courses.map(c => c._id.toString());
  
  const enrollmentsWithInvalidCourses = enrollments.filter(e => 
    !courseIds.includes(e.courseId.toString())
  );
  
  if (enrollmentsWithInvalidCourses.length > 0) {

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

    return false;
  }

  return true;
}

async function validateCommentData() {

  const comments = await Comment.find({});

  // Check required fields
  const invalidComments = comments.filter(c => 
    !c.commentId || !c.content || !c.authorId || !c.contentType || !c.contentId
  );
  if (invalidComments.length > 0) {

    return false;
  }
  
  // Check author relationships
  const users = await User.find({});
  const userIds = users.map(u => u._id.toString());
  
  const commentsWithInvalidAuthors = comments.filter(c => 
    !userIds.includes(c.authorId.toString())
  );
  
  if (commentsWithInvalidAuthors.length > 0) {

    return false;
  }

  return true;
}

async function validateCertificateData() {

  const certificates = await Certificate.find({});

  // Check required fields
  const invalidCertificates = certificates.filter(c => 
    !c.certificateId || !c.verificationCode || !c.courseId || !c.studentId || !c.instructorId
  );
  if (invalidCertificates.length > 0) {

    return false;
  }
  
  // Check relationships
  const courses = await Course.find({});
  const courseIds = courses.map(c => c._id.toString());
  
  const certificatesWithInvalidCourses = certificates.filter(c => 
    !courseIds.includes(c.courseId.toString())
  );
  
  if (certificatesWithInvalidCourses.length > 0) {

    return false;
  }

  return true;
}

async function validateRelationships() {

  // Check enrollment-course-instructor consistency
  const enrollments = await Enrollment.find({}).populate('courseId');
  const inconsistentEnrollments = enrollments.filter(e => {
    const course = e.courseId as any;
    return !course.instructorId.equals(e.instructorId);
  });
  
  if (inconsistentEnrollments.length > 0) {

    return false;
  }
  
  // Check certificate-enrollment consistency
  const certificates = await Certificate.find({});
  const enrollmentsForCertificates = await Enrollment.find({ isCompleted: true });
  
  if (certificates.length !== enrollmentsForCertificates.length) {
    console.error(`❌ Certificate count (${certificates.length}) doesn't match completed enrollments (${enrollmentsForCertificates.length})`);
    return false;
  }

  return true;
}

// Main validation function
async function validateSeedData() {
  try {

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');

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

    } else {

    }
    
    return allPassed;
    
  } catch (error) {

    return false;
  } finally {
    await mongoose.disconnect();

  }
}

// Run validation if called directly
if (require.main === module) {
  validateSeedData()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {

      process.exit(1);
    });
}

export default validateSeedData;
