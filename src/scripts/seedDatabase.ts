import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import {
  User,
  Course,
  Section,
  Lesson,
  Assignment,
  Submission,
  Enrollment,
  Bill,
  RefundRequest,
  CourseRating,
} from '../models';

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_database';

// Sample data
const sampleUsers = [
  {
    email: 'admin@lms.com',
    password: 'admin123',
    name: 'Admin User',
    roles: ['admin'],
    subscriptionPlan: 'advanced',
    isActive: true,
    emailVerified: true,
    bio: 'System Administrator',
    stats: {
      totalCoursesEnrolled: 0,
      totalCoursesCompleted: 0,
      totalAssignmentsSubmitted: 0,
      averageScore: 0,
      totalLearningTime: 0,
    },
  },
  {
    email: 'teacher@lms.com',
    password: 'teacher123',
    name: 'John Teacher',
    roles: ['teacher'],
    subscriptionPlan: 'pro',
    isActive: true,
    emailVerified: true,
    bio: 'Experienced instructor in IT and programming',
    phone: '+84 123 456 789',
    country: 'Vietnam',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/johnteacher',
      github: 'https://github.com/johnteacher',
    },
    stats: {
      totalCoursesEnrolled: 0,
      totalCoursesCompleted: 0,
      totalAssignmentsSubmitted: 0,
      averageScore: 0,
      totalLearningTime: 0,
    },
  },
  {
    email: 'student@lms.com',
    password: 'student123',
    name: 'Alice Student',
    roles: ['student'],
    subscriptionPlan: 'free',
    isActive: true,
    emailVerified: true,
    bio: 'Passionate learner',
    phone: '+84 987 654 321',
    country: 'Vietnam',
    stats: {
      totalCoursesEnrolled: 0,
      totalCoursesCompleted: 0,
      totalAssignmentsSubmitted: 0,
      averageScore: 0,
      totalLearningTime: 0,
    },
  },
];

const sampleCourses = [
  {
    title: 'JavaScript Fundamentals',
    description:
      'Learn the basics of JavaScript programming language from scratch. This course covers variables, functions, objects, and modern ES6+ features.',
    shortDescription: 'Master JavaScript basics and modern features',
    domain: 'IT',
    level: 'beginner',
    prerequisites: [
      'Basic computer knowledge',
      'No programming experience required',
    ],
    benefits: [
      'Build interactive websites',
      'Understand modern web development',
      'Prepare for advanced JavaScript frameworks',
    ],
    relatedLinks: [
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      'https://javascript.info/',
    ],
    price: 500000,
    originalPrice: 800000,
    discountPercentage: 37.5,
    isPublished: true,
    isApproved: true,
    isFeatured: true,
    tags: ['javascript', 'programming', 'web-development', 'beginner'],
    language: 'en',
    certificate: true,
    maxStudents: 1000,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  },
  {
    title: 'React.js Advanced',
    description:
      'Deep dive into React.js advanced concepts including hooks, context, performance optimization, and state management with Redux.',
    shortDescription: 'Advanced React.js development techniques',
    domain: 'IT',
    level: 'intermediate',
    prerequisites: [
      'JavaScript fundamentals',
      'Basic React knowledge',
      'ES6+ features',
    ],
    benefits: [
      'Build scalable React applications',
      'Master advanced React patterns',
      'Learn state management best practices',
    ],
    relatedLinks: [
      'https://reactjs.org/docs/getting-started.html',
      'https://redux.js.org/',
    ],
    price: 800000,
    originalPrice: 1200000,
    discountPercentage: 33.3,
    isPublished: true,
    isApproved: true,
    isFeatured: true,
    tags: ['react', 'javascript', 'frontend', 'redux', 'hooks'],
    language: 'en',
    certificate: true,
    maxStudents: 500,
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  },
];

const sampleSections = [
  {
    title: 'Introduction to JavaScript',
    description: 'Get started with JavaScript basics',
    order: 1,
    isVisible: true,
  },
  {
    title: 'Variables and Data Types',
    description: 'Learn about variables, strings, numbers, and booleans',
    order: 2,
    isVisible: true,
  },
  {
    title: 'Functions and Scope',
    description: 'Understanding functions and variable scope',
    order: 3,
    isVisible: true,
  },
];

const sampleLessons = [
  {
    title: 'What is JavaScript?',
    content: 'JavaScript is a programming language that powers the modern web.',
    type: 'text',
    order: 1,
    isRequired: true,
    isPreview: true,
    estimatedTime: 5,
  },
  {
    title: 'Setting up your environment',
    content: 'Learn how to set up JavaScript development environment.',
    type: 'text',
    order: 2,
    isRequired: true,
    isPreview: false,
    estimatedTime: 10,
  },
  {
    title: 'Your first JavaScript code',
    content: 'Write and run your first JavaScript program.',
    type: 'text',
    order: 3,
    isRequired: true,
    isPreview: false,
    estimatedTime: 15,
  },
];

const sampleAssignments = [
  {
    title: 'Hello World Program',
    description:
      'Create your first JavaScript program that prints "Hello World"',
    instructions: 'Write a simple JavaScript program using console.log()',
    type: 'text',
    maxScore: 10,
    attempts: 3,
    isRequired: true,
    isGraded: true,
    gradingCriteria: ['Correct syntax', 'Proper output', 'Code comments'],
    importantNotes: [
      'Use console.log() function',
      'Test your code before submitting',
    ],
  },
];

// Database seeder function
const seedDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Section.deleteMany({});
    await Lesson.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Enrollment.deleteMany({});
    await Bill.deleteMany({});
    await RefundRequest.deleteMany({});
    await CourseRating.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];

    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword,
      });
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`✅ Created user: ${savedUser.name} (${savedUser.email})`);
    }

    // Create courses
    console.log('📚 Creating courses...');
    const teacher = createdUsers.find(user => user.roles.includes('teacher'));
    const createdCourses = [];

    for (const courseData of sampleCourses) {
      const course = new Course({
        ...courseData,
        instructorId: teacher!._id,
      });
      const savedCourse = await course.save();
      createdCourses.push(savedCourse);
      console.log(`✅ Created course: ${savedCourse.title}`);
    }

    // Create sections
    console.log('📑 Creating sections...');
    const createdSections = [];

    for (const sectionData of sampleSections) {
      const section = new Section({
        ...sectionData,
        courseId: createdCourses[0]._id,
      });
      const savedSection = await section.save();
      createdSections.push(savedSection);
      console.log(`✅ Created section: ${savedSection.title}`);
    }

    // Create lessons
    console.log('📖 Creating lessons...');
    const createdLessons = [];

    for (let i = 0; i < sampleLessons.length; i++) {
      const lessonData = sampleLessons[i];
      const lesson = new Lesson({
        ...lessonData,
        sectionId: createdSections[i]._id,
        courseId: createdCourses[0]._id,
      });
      const savedLesson = await lesson.save();
      createdLessons.push(savedLesson);
      console.log(`✅ Created lesson: ${savedLesson.title}`);
    }

    // Create assignments
    console.log('📝 Creating assignments...');
    const createdAssignments = [];

    for (const assignmentData of sampleAssignments) {
      const assignment = new Assignment({
        ...assignmentData,
        lessonId: createdLessons[0]._id,
        courseId: createdCourses[0]._id,
      });
      const savedAssignment = await assignment.save();
      createdAssignments.push(savedAssignment);
      console.log(`✅ Created assignment: ${savedAssignment.title}`);
    }

    // Create enrollment
    console.log('🎓 Creating enrollment...');
    const student = createdUsers.find(user => user.roles.includes('student'));
    const enrollment = new Enrollment({
      studentId: student!._id,
      courseId: createdCourses[0]._id,
      instructorId: teacher!._id,
      enrolledAt: new Date(),
      progress: 0,
      isActive: true,
    });
    await enrollment.save();
    console.log(`✅ Created enrollment for ${student!.name}`);

    // Create bill
    console.log('💰 Creating bill...');
    const bill = new Bill({
      studentId: student!._id,
      courseId: createdCourses[0]._id,
      amount: createdCourses[0].price,
      currency: 'VND',
      purpose: 'course_purchase',
      status: 'completed',
      paymentMethod: 'stripe',
      description: `Payment for course: ${createdCourses[0].title}`,
      paidAt: new Date(),
    });
    await bill.save();
    console.log(`✅ Created bill for course purchase`);

    // Create course rating
    console.log('⭐ Creating course rating...');
    const rating = new CourseRating({
      courseId: createdCourses[0]._id,
      studentId: student!._id,
      type: 'upvote',
      rating: 5,
      comment: 'Great course! Very informative and well-structured.',
      isAnonymous: false,
      isVerified: true,
    });
    await rating.save();
    console.log(`✅ Created course rating`);

    console.log('🎉 Database seeding completed successfully!');
    console.log(
      `📊 Created ${createdUsers.length} users, ${createdCourses.length} courses, ${createdSections.length} sections, ${createdLessons.length} lessons, ${createdAssignments.length} assignments, 1 enrollment, 1 bill, and 1 rating`
    );
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run seeder if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
