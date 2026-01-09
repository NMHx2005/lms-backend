import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
import Submission from '../../shared/models/core/Submission';

// Sample data for Users
const usersData = [
  {
    email: 'admin@lms.com',
    password: 'Admin@123',
    name: 'Nguyễn Văn Admin',
    firstName: 'Nguyễn Văn',
    lastName: 'Admin',
    roles: ['admin'],
    role: 'admin',
    subscriptionPlan: 'advanced',
    isActive: true,
    emailVerified: true,
    isEmailVerified: true,
    phone: '0901234567',
    country: 'Vietnam',
    bio: 'System Administrator',
    avatar: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=A'
  },
  {
    email: 'teacher1@lms.com',
    password: 'Teacher@123',
    name: 'Trần Thị Giáo Viên',
    firstName: 'Trần Thị',
    lastName: 'Giáo Viên',
    roles: ['teacher'],
    role: 'teacher',
    subscriptionPlan: 'pro',
    isActive: true,
    emailVerified: true,
    isEmailVerified: true,
    phone: '0901234568',
    country: 'Vietnam',
    bio: 'Experienced Programming Instructor',
    avatar: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=T1'
  },
  {
    email: 'teacher2@lms.com',
    password: 'Teacher@123',
    name: 'Lê Văn Sư Phạm',
    firstName: 'Lê Văn',
    lastName: 'Sư Phạm',
    roles: ['teacher'],
    role: 'teacher',
    subscriptionPlan: 'pro',
    isActive: true,
    emailVerified: true,
    isEmailVerified: true,
    phone: '0901234569',
    country: 'Vietnam',
    bio: 'Web Development Expert',
    avatar: 'https://via.placeholder.com/150/45B7D1/FFFFFF?text=T2'
  },
  {
    email: 'student1@lms.com',
    password: 'Student@123',
    name: 'Phạm Văn Học Sinh',
    firstName: 'Phạm Văn',
    lastName: 'Học Sinh',
    roles: ['student'],
    role: 'student',
    subscriptionPlan: 'free',
    isActive: true,
    emailVerified: true,
    isEmailVerified: true,
    phone: '0901234570',
    country: 'Vietnam',
    bio: 'Passionate learner',
    avatar: 'https://via.placeholder.com/150/96CEB4/FFFFFF?text=S1'
  },
  {
    email: 'student2@lms.com',
    password: 'Student@123',
    name: 'Hoàng Thị Sinh Viên',
    firstName: 'Hoàng Thị',
    lastName: 'Sinh Viên',
    roles: ['student'],
    role: 'student',
    subscriptionPlan: 'pro',
    isActive: true,
    emailVerified: true,
    isEmailVerified: true,
    phone: '0901234571',
    country: 'Vietnam',
    bio: 'Computer Science Student',
    avatar: 'https://via.placeholder.com/150/FFEAA7/FFFFFF?text=S2'
  },
  {
    email: 'student3@lms.com',
    password: 'Student@123',
    name: 'Vũ Đức Học Viên',
    firstName: 'Vũ Đức',
    lastName: 'Học Viên',
    roles: ['student'],
    role: 'student',
    subscriptionPlan: 'free',
    isActive: true,
    emailVerified: true,
    isEmailVerified: true,
    phone: '0901234572',
    country: 'Vietnam',
    bio: 'Frontend Developer Aspirant',
    avatar: 'https://via.placeholder.com/150/DDA0DD/FFFFFF?text=S3'
  },
  {
    email: 'student4@lms.com',
    password: 'Student@123',
    name: 'Ngô Thị Học Trò',
    firstName: 'Ngô Thị',
    lastName: 'Học Trò',
    roles: ['student'],
    role: 'student',
    subscriptionPlan: 'advanced',
    isActive: true,
    emailVerified: true,
    isEmailVerified: true,
    phone: '0901234573',
    country: 'Vietnam',
    bio: 'Full-stack Developer Student',
    avatar: 'https://via.placeholder.com/150/98D8C8/FFFFFF?text=S4'
  },
  {
    email: 'student5@lms.com',
    password: 'Student@123',
    name: 'Đinh Văn Sinh Viên',
    firstName: 'Đinh Văn',
    lastName: 'Sinh Viên',
    roles: ['student'],
    role: 'student',
    subscriptionPlan: 'pro',
    isActive: true,
    emailVerified: true,
    isEmailVerified: true,
    phone: '0901234574',
    country: 'Vietnam',
    bio: 'Mobile App Developer',
    avatar: 'https://via.placeholder.com/150/F7DC6F/FFFFFF?text=S5'
  }
];

// Sample data for Courses
const coursesData = [
  {
    title: 'Lập trình Web Frontend từ Cơ bản đến Nâng cao',
    description: 'Khóa học toàn diện về phát triển web frontend, từ HTML/CSS cơ bản đến React/Vue.js nâng cao. Học viên sẽ được trang bị đầy đủ kiến thức để xây dựng các ứng dụng web hiện đại.',
    shortDescription: 'Học lập trình web frontend từ cơ bản đến nâng cao',
    domain: 'IT',
    level: 'beginner',
    prerequisites: ['Kiến thức cơ bản về máy tính', 'Tư duy logic'],
    benefits: [
      'Thành thạo HTML, CSS, JavaScript',
      'Xây dựng ứng dụng React/Vue.js',
      'Responsive design và UI/UX',
      'Tối ưu hóa hiệu suất web'
    ],
    learningObjectives: [
      'Hiểu rõ cấu trúc HTML và semantic markup',
      'Thành thạo CSS Grid, Flexbox và responsive design',
      'Lập trình JavaScript ES6+ và DOM manipulation',
      'Xây dựng ứng dụng React với hooks và context'
    ],
    estimatedDuration: 120,
    price: 2500000,
    originalPrice: 3000000,
    discountPercentage: 16.67, // 3000000 * (1 - 16.67/100) = 2500000
    status: 'published',
    isPublished: true,
    isApproved: true,
    isFeatured: true,
    category: 'Programming',
    subcategory: 'Web Development',
    difficulty: 'beginner',
    targetAudience: ['Sinh viên IT', 'Người mới bắt đầu', 'Freelancer'],
    ageGroup: 'adults',
    tags: ['web-development', 'frontend', 'html', 'css', 'javascript', 'react'],
    language: 'en',
    thumbnail: 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Web+Development',
    relatedLinks: ['https://developer.mozilla.org', 'https://reactjs.org'],
    externalLinks: [
      { name: 'MDN Web Docs', url: 'https://developer.mozilla.org', description: 'Tài liệu web development chính thức' },
      { name: 'React Documentation', url: 'https://reactjs.org', description: 'Tài liệu React chính thức' }
    ],
    accessibility: {
      hasSubtitles: true,
      hasAudioDescription: false,
      hasSignLanguage: false,
      supportsScreenReaders: true,
      hasHighContrast: true
    },
    technicalRequirements: {
      minBandwidth: 2,
      recommendedBandwidth: 10,
      supportedDevices: ['Desktop', 'Laptop', 'Tablet'],
      requiredSoftware: ['VS Code', 'Chrome DevTools'],
      browserCompatibility: ['Chrome', 'Firefox', 'Safari', 'Edge']
    },
    assessment: {
      hasQuizzes: true,
      hasAssignments: true,
      hasFinalExam: true,
      hasCertification: true,
      passingScore: 70,
      maxAttempts: 3
    }
  },
  {
    title: 'Phát triển Ứng dụng Mobile với React Native',
    description: 'Khóa học chuyên sâu về phát triển ứng dụng mobile cross-platform sử dụng React Native. Học viên sẽ học cách xây dựng ứng dụng cho cả iOS và Android với một codebase duy nhất.',
    shortDescription: 'Xây dựng ứng dụng mobile với React Native',
    domain: 'IT',
    level: 'intermediate',
    prerequisites: ['JavaScript cơ bản', 'React cơ bản', 'Kiến thức về mobile development'],
    benefits: [
      'Phát triển ứng dụng cross-platform',
      'Sử dụng React Native và Expo',
      'Tích hợp API và database',
      'Deploy lên App Store và Google Play'
    ],
    learningObjectives: [
      'Hiểu rõ React Native architecture',
      'Xây dựng UI components và navigation',
      'Tích hợp native modules và APIs',
      'Testing và deployment strategies'
    ],
    estimatedDuration: 100,
    price: 3000000,
    originalPrice: 3500000,
    discountPercentage: 14.29, // 3500000 * (1 - 14.29/100) = 3000000
    status: 'published',
    isPublished: true,
    isApproved: true,
    isFeatured: true,
    category: 'Programming',
    subcategory: 'Mobile Development',
    difficulty: 'intermediate',
    targetAudience: ['Frontend Developer', 'Mobile Developer', 'Full-stack Developer'],
    ageGroup: 'adults',
    tags: ['mobile-development', 'react-native', 'cross-platform', 'ios', 'android'],
    language: 'en',
    thumbnail: 'https://via.placeholder.com/400x300/45B7D1/FFFFFF?text=React+Native',
    relatedLinks: ['https://reactnative.dev', 'https://expo.dev'],
    externalLinks: [
      { name: 'React Native Docs', url: 'https://reactnative.dev', description: 'Tài liệu React Native chính thức' },
      { name: 'Expo Documentation', url: 'https://expo.dev', description: 'Tài liệu Expo chính thức' }
    ],
    accessibility: {
      hasSubtitles: true,
      hasAudioDescription: false,
      hasSignLanguage: false,
      supportsScreenReaders: true,
      hasHighContrast: true
    },
    technicalRequirements: {
      minBandwidth: 5,
      recommendedBandwidth: 15,
      supportedDevices: ['Desktop', 'Laptop'],
      requiredSoftware: ['Node.js', 'Expo CLI', 'Android Studio/Xcode'],
      browserCompatibility: ['Chrome', 'Firefox']
    },
    assessment: {
      hasQuizzes: true,
      hasAssignments: true,
      hasFinalExam: true,
      hasCertification: true,
      passingScore: 75,
      maxAttempts: 2
    }
  },
  {
    title: 'Machine Learning và AI cơ bản',
    description: 'Khóa học giới thiệu về Machine Learning và Artificial Intelligence, từ lý thuyết cơ bản đến thực hành với Python. Học viên sẽ hiểu được các thuật toán ML cơ bản và cách áp dụng vào thực tế.',
    shortDescription: 'Học Machine Learning và AI cơ bản',
    domain: 'Science',
    level: 'intermediate',
    prerequisites: ['Python cơ bản', 'Toán học cơ bản', 'Thống kê cơ bản'],
    benefits: [
      'Hiểu rõ các thuật toán ML cơ bản',
      'Thực hành với Python và scikit-learn',
      'Xây dựng model dự đoán',
      'Áp dụng ML vào dự án thực tế'
    ],
    learningObjectives: [
      'Hiểu rõ supervised và unsupervised learning',
      'Thực hành với regression và classification',
      'Xử lý dữ liệu và feature engineering',
      'Đánh giá và tối ưu hóa model'
    ],
    estimatedDuration: 150,
    price: 4000000,
    originalPrice: 4500000,
    discountPercentage: 11.11, // 4500000 * (1 - 11.11/100) = 4000000
    status: 'published',
    isPublished: true,
    isApproved: true,
    isFeatured: false,
    category: 'Data Science',
    subcategory: 'Machine Learning',
    difficulty: 'intermediate',
    targetAudience: ['Data Scientist', 'Software Engineer', 'Student'],
    ageGroup: 'adults',
    tags: ['machine-learning', 'ai', 'python', 'data-science', 'scikit-learn'],
    language: 'en',
    thumbnail: 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Machine+Learning',
    relatedLinks: ['https://scikit-learn.org', 'https://pandas.pydata.org'],
    externalLinks: [
      { name: 'Scikit-learn Docs', url: 'https://scikit-learn.org', description: 'Tài liệu scikit-learn chính thức' },
      { name: 'Pandas Documentation', url: 'https://pandas.pydata.org', description: 'Tài liệu Pandas chính thức' }
    ],
    accessibility: {
      hasSubtitles: true,
      hasAudioDescription: false,
      hasSignLanguage: false,
      supportsScreenReaders: true,
      hasHighContrast: true
    },
    technicalRequirements: {
      minBandwidth: 3,
      recommendedBandwidth: 10,
      supportedDevices: ['Desktop', 'Laptop'],
      requiredSoftware: ['Python 3.8+', 'Jupyter Notebook', 'Anaconda'],
      browserCompatibility: ['Chrome', 'Firefox', 'Safari']
    },
    assessment: {
      hasQuizzes: true,
      hasAssignments: true,
      hasFinalExam: true,
      hasCertification: true,
      passingScore: 80,
      maxAttempts: 2
    }
  },
  {
    title: 'Thiết kế UI/UX cho Web và Mobile',
    description: 'Khóa học về thiết kế giao diện người dùng và trải nghiệm người dùng cho web và mobile. Học viên sẽ học các nguyên tắc thiết kế, công cụ thiết kế và quy trình thiết kế UI/UX chuyên nghiệp.',
    shortDescription: 'Học thiết kế UI/UX chuyên nghiệp',
    domain: 'Design',
    level: 'beginner',
    prerequisites: ['Không yêu cầu kiến thức lập trình', 'Tư duy sáng tạo'],
    benefits: [
      'Thành thạo Figma và Adobe XD',
      'Hiểu rõ nguyên tắc thiết kế UI/UX',
      'Xây dựng design system',
      'Tạo prototype và wireframe'
    ],
    learningObjectives: [
      'Hiểu rõ các nguyên tắc thiết kế UI/UX',
      'Sử dụng Figma và Adobe XD',
      'Xây dựng wireframe và prototype',
      'Thiết kế responsive và accessible'
    ],
    estimatedDuration: 80,
    price: 2000000,
    originalPrice: 2500000,
    discountPercentage: 20, // 2500000 * (1 - 20/100) = 2000000
    status: 'published',
    isPublished: true,
    isApproved: true,
    isFeatured: false,
    category: 'Design',
    subcategory: 'UI/UX Design',
    difficulty: 'beginner',
    targetAudience: ['Designer', 'Product Manager', 'Developer'],
    ageGroup: 'adults',
    tags: ['ui-ux', 'design', 'figma', 'adobe-xd', 'prototype', 'wireframe'],
    language: 'en',
    thumbnail: 'https://via.placeholder.com/400x300/96CEB4/FFFFFF?text=UI+UX+Design',
    relatedLinks: ['https://www.figma.com', 'https://www.adobe.com/products/xd.html'],
    externalLinks: [
      { name: 'Figma Community', url: 'https://www.figma.com', description: 'Cộng đồng thiết kế Figma' },
      { name: 'Adobe XD', url: 'https://www.adobe.com/products/xd.html', description: 'Công cụ thiết kế Adobe XD' }
    ],
    accessibility: {
      hasSubtitles: true,
      hasAudioDescription: false,
      hasSignLanguage: false,
      supportsScreenReaders: true,
      hasHighContrast: true
    },
    technicalRequirements: {
      minBandwidth: 2,
      recommendedBandwidth: 8,
      supportedDevices: ['Desktop', 'Laptop'],
      requiredSoftware: ['Figma', 'Adobe XD', 'Sketch'],
      browserCompatibility: ['Chrome', 'Firefox', 'Safari']
    },
    assessment: {
      hasQuizzes: true,
      hasAssignments: true,
      hasFinalExam: true,
      hasCertification: true,
      passingScore: 70,
      maxAttempts: 3
    }
  },
  {
    title: 'DevOps và CI/CD Pipeline',
    description: 'Khóa học về DevOps practices, CI/CD pipeline, containerization với Docker, và orchestration với Kubernetes. Học viên sẽ học cách tự động hóa quy trình phát triển và deployment.',
    shortDescription: 'Học DevOps và CI/CD pipeline',
    domain: 'IT',
    level: 'advanced',
    prerequisites: ['Linux cơ bản', 'Git cơ bản', 'Kiến thức về networking'],
    benefits: [
      'Thành thạo Docker và Kubernetes',
      'Xây dựng CI/CD pipeline',
      'Monitoring và logging',
      'Infrastructure as Code'
    ],
    learningObjectives: [
      'Hiểu rõ DevOps culture và practices',
      'Containerization với Docker',
      'Orchestration với Kubernetes',
      'CI/CD với Jenkins/GitHub Actions'
    ],
    estimatedDuration: 120,
    price: 3500000,
    originalPrice: 4000000,
    discountPercentage: 12.5, // 4000000 * (1 - 12.5/100) = 3500000
    status: 'published',
    isPublished: true,
    isApproved: true,
    isFeatured: true,
    category: 'DevOps',
    subcategory: 'CI/CD',
    difficulty: 'advanced',
    targetAudience: ['DevOps Engineer', 'System Administrator', 'Developer'],
    ageGroup: 'adults',
    tags: ['devops', 'ci-cd', 'docker', 'kubernetes', 'jenkins', 'automation'],
    language: 'en',
    thumbnail: 'https://via.placeholder.com/400x300/F7DC6F/FFFFFF?text=DevOps+CI+CD',
    relatedLinks: ['https://www.docker.com', 'https://kubernetes.io'],
    externalLinks: [
      { name: 'Docker Hub', url: 'https://www.docker.com', description: 'Container platform chính thức' },
      { name: 'Kubernetes Docs', url: 'https://kubernetes.io', description: 'Tài liệu Kubernetes chính thức' }
    ],
    accessibility: {
      hasSubtitles: true,
      hasAudioDescription: false,
      hasSignLanguage: false,
      supportsScreenReaders: true,
      hasHighContrast: true
    },
    technicalRequirements: {
      minBandwidth: 5,
      recommendedBandwidth: 15,
      supportedDevices: ['Desktop', 'Laptop'],
      requiredSoftware: ['Docker Desktop', 'Kubernetes', 'Vagrant'],
      browserCompatibility: ['Chrome', 'Firefox', 'Safari']
    },
    assessment: {
      hasQuizzes: true,
      hasAssignments: true,
      hasFinalExam: true,
      hasCertification: true,
      passingScore: 80,
      maxAttempts: 2
    }
  }
];

// Sample data for Sections
const sectionsData = [
  {
    title: 'Giới thiệu và Cài đặt Môi trường',
    description: 'Chuẩn bị môi trường học tập và cài đặt các công cụ cần thiết',
    order: 1,
    isPublished: true
  },
  {
    title: 'HTML cơ bản',
    description: 'Học các thẻ HTML cơ bản và semantic markup',
    order: 2,
    isPublished: true
  },
  {
    title: 'CSS cơ bản',
    description: 'Styling và layout với CSS',
    order: 3,
    isPublished: true
  },
  {
    title: 'JavaScript cơ bản',
    description: 'Lập trình JavaScript ES6+',
    order: 4,
    isPublished: true
  },
  {
    title: 'React cơ bản',
    description: 'Giới thiệu React và component-based architecture',
    order: 5,
    isPublished: true
  }
];

// Sample data for Lessons
const lessonsData = [
  {
    title: 'Cài đặt Node.js và VS Code',
    description: 'Hướng dẫn cài đặt Node.js và VS Code cho development',
    content: 'Video hướng dẫn cài đặt và cấu hình môi trường',
    type: 'video',
    estimatedTime: 15,
    order: 1,
    isPublished: true,
    videoUrl: 'https://example.com/videos/lesson1.mp4',
    resources: [
      { name: 'Node.js Download Link', url: 'https://nodejs.org' },
      { name: 'VS Code Download Link', url: 'https://code.visualstudio.com' }
    ]
  },
  {
    title: 'HTML Structure và Semantic Tags',
    description: 'Học cấu trúc HTML và các thẻ semantic',
    content: 'Bài giảng về HTML structure và semantic tags',
    type: 'video',
    estimatedTime: 30,
    order: 2,
    isPublished: true,
    videoUrl: 'https://example.com/videos/lesson2.mp4',
    resources: [
      { name: 'HTML Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' }
    ]
  },
  {
    title: 'CSS Selectors và Properties',
    description: 'Học CSS selectors và các properties cơ bản',
    content: 'Bài giảng về CSS selectors và properties',
    type: 'video',
    estimatedTime: 45,
    order: 3,
    isPublished: true,
    videoUrl: 'https://example.com/videos/lesson3.mp4',
    resources: [
      { name: 'CSS Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' }
    ]
  },
  {
    title: 'JavaScript Variables và Functions',
    description: 'Học JavaScript variables và functions',
    content: 'Bài giảng về JavaScript variables và functions',
    type: 'video',
    estimatedTime: 40,
    order: 4,
    isPublished: true,
    videoUrl: 'https://example.com/videos/lesson4.mp4',
    resources: [
      { name: 'JavaScript Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' }
    ]
  },
  {
    title: 'React Components và JSX',
    description: 'Học React components và JSX syntax',
    content: 'Bài giảng về React components và JSX',
    type: 'video',
    estimatedTime: 50,
    order: 5,
    isPublished: true,
    videoUrl: 'https://example.com/videos/lesson5.mp4',
    resources: [
      { name: 'React Documentation', url: 'https://reactjs.org/docs' }
    ]
  }
];

// Sample data for Assignments
const assignmentsData = [
  {
    title: 'Tạo trang web cá nhân',
    description: 'Sử dụng HTML và CSS để tạo một trang web cá nhân đơn giản',
    instructions: 'Tạo trang web với header, navigation, main content và footer',
    type: 'text',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    maxScore: 100,
    timeLimit: 120,
    attempts: 3,
    gradingCriteria: [
      'HTML structure đúng chuẩn (30 điểm)',
      'CSS styling đẹp mắt (40 điểm)',
      'Responsive design (20 điểm)',
      'Code quality (10 điểm)'
    ]
  },
  {
    title: 'JavaScript Calculator',
    description: 'Tạo một calculator đơn giản bằng JavaScript',
    instructions: 'Tạo calculator với các phép tính cơ bản: cộng, trừ, nhân, chia',
    type: 'text',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    maxScore: 100,
    timeLimit: 180,
    attempts: 2,
    gradingCriteria: [
      'Functionality hoàn chỉnh (50 điểm)',
      'User interface (25 điểm)',
      'Error handling (15 điểm)',
      'Code organization (10 điểm)'
    ]
  },
  {
    title: 'React Todo App',
    description: 'Xây dựng ứng dụng Todo với React',
    instructions: 'Tạo app với chức năng thêm, xóa, edit và mark complete todo items',
    type: 'text',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    maxScore: 100,
    timeLimit: 240,
    attempts: 2,
    gradingCriteria: [
      'CRUD operations (40 điểm)',
      'State management (25 điểm)',
      'Component structure (20 điểm)',
      'User experience (15 điểm)'
    ]
  }
];

// Sample data for Course Reviews
const courseReviewsData = [
  {
    title: 'Khóa học rất hay và bổ ích!',
    content: 'Khóa học rất hay và bổ ích! Giảng viên giải thích rõ ràng, dễ hiểu. Nội dung cập nhật và thực tế.',
    rating: 5,
    isAnonymous: false,
    helpfulCount: 12,
    reportCount: 0
  },
  {
    title: 'Khóa học tốt, nội dung phong phú',
    content: 'Khóa học tốt, nội dung phong phú. Tuy nhiên một số bài tập có thể khó hơn một chút.',
    rating: 4,
    isAnonymous: false,
    helpfulCount: 8,
    reportCount: 0
  },
  {
    title: 'Tuyệt vời! Học được rất nhiều',
    content: 'Tuyệt vời! Tôi đã học được rất nhiều từ khóa học này. Đặc biệt thích phần thực hành.',
    rating: 5,
    isAnonymous: true,
    helpfulCount: 15,
    reportCount: 0
  },
  {
    title: 'Khóa học chất lượng cao',
    content: 'Khóa học chất lượng cao, giảng viên nhiệt tình. Nội dung phù hợp với người mới bắt đầu.',
    rating: 4,
    isAnonymous: false,
    helpfulCount: 6,
    reportCount: 0
  },
  {
    title: 'Rất hài lòng với khóa học!',
    content: 'Rất hài lòng với khóa học! Tôi đã có thể tạo được website đầu tiên của mình.',
    rating: 5,
    isAnonymous: false,
    helpfulCount: 10,
    reportCount: 0
  }
];

// Sample data for Teacher Ratings
const teacherRatingsData = [
  {
    overallRating: 4.8,
    teachingEffectiveness: 5,
    communicationSkills: 4,
    responsiveness: 5,
    courseOrganization: 4,
    feedbackQuality: 5,
    comment: 'Giảng viên rất nhiệt tình và có kinh nghiệm. Giải thích rõ ràng, dễ hiểu.',
    isAnonymous: false,
    helpfulCount: 8,
    reportCount: 0
  },
  {
    overallRating: 4.6,
    teachingEffectiveness: 4,
    communicationSkills: 5,
    responsiveness: 4,
    courseOrganization: 5,
    feedbackQuality: 4,
    comment: 'Giảng viên có kiến thức sâu rộng và truyền đạt tốt.',
    isAnonymous: false,
    helpfulCount: 6,
    reportCount: 0
  },
  {
    overallRating: 4.9,
    teachingEffectiveness: 5,
    communicationSkills: 5,
    responsiveness: 5,
    courseOrganization: 4,
    feedbackQuality: 5,
    comment: 'Một trong những giảng viên tốt nhất tôi từng học!',
    isAnonymous: true,
    helpfulCount: 12,
    reportCount: 0
  }
];

// Sample data for Comments
const commentsData = [
  {
    content: 'Bài giảng rất hay! Tôi đã hiểu rõ về HTML semantic tags.',
    contentType: 'lesson',
    isModerated: true,
    moderationStatus: 'approved',
    isHelpful: false
  },
  {
    content: 'Có ai có thể giải thích thêm về CSS Grid không?',
    contentType: 'lesson',
    isModerated: true,
    moderationStatus: 'approved',
    isHelpful: false
  },
  {
    content: 'Tôi thích cách giảng viên giải thích từng bước một cách chi tiết.',
    contentType: 'course',
    isModerated: true,
    moderationStatus: 'approved',
    isHelpful: true
  },
  {
    content: 'Bài tập này khó quá, có thể giúp tôi không?',
    contentType: 'assignment',
    isModerated: true,
    moderationStatus: 'approved',
    isHelpful: false
  },
  {
    content: 'Cảm ơn giảng viên đã trả lời câu hỏi của tôi rất nhanh!',
    contentType: 'course',
    isModerated: true,
    moderationStatus: 'approved',
    isHelpful: true
  }
];

// Main seeding function
async function seedDatabase() {
  try {

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');

    // Clear existing data

    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Section.deleteMany({}),
      Lesson.deleteMany({}),
      Enrollment.deleteMany({}),
      Payment.deleteMany({}),
      Order.deleteMany({}),
      Certificate.deleteMany({}),
      TeacherRating.deleteMany({}),
      Comment.deleteMany({}),
      CourseReview.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({})
    ]);

    // Create users

    let users;
    try {
      const hashedUsersData = usersData.map(user => ({
        ...user,
        password: bcrypt.hashSync(user.password, 10)
      }));
      users = await User.insertMany(hashedUsersData);

    } catch (error) {

      throw error;
    }

    // Get user IDs for reference
    const adminUser = users.find(u => u.role === 'admin')!;
    const teacherUsers = users.filter(u => u.role === 'teacher');
    const studentUsers = users.filter(u => u.role === 'student');

    // Validation
    if (!teacherUsers.length) {
      throw new Error('Không có teachers để gán cho courses');
    }
    if (!studentUsers.length) {
      throw new Error('Không có students để tạo enrollments');
    }
    if (!adminUser) {
      throw new Error('Không có admin user');
    }

    // Create courses with instructor IDs

    const coursesWithInstructors = coursesData.map((course, index) => ({
      ...course,
      instructorId: teacherUsers[index % teacherUsers.length]._id
    }));
    const courses = await Course.insertMany(coursesWithInstructors);

    // Create sections for first course

    const sectionsWithCourse = sectionsData.map(section => ({
      ...section,
      courseId: courses[0]._id
    }));
    const sections = await Section.insertMany(sectionsWithCourse);

    // Create lessons for first section

    const lessonsWithSection = lessonsData.map((lesson, index) => ({
      ...lesson,
      courseId: courses[0]._id,
      sectionId: sections[index]._id, // Mỗi lesson thuộc về section tương ứng
      order: lesson.order // Đảm bảo order đúng
    }));
    const lessons = await Lesson.insertMany(lessonsWithSection);

    // Create assignments for first course

    const assignmentsWithCourse = assignmentsData.map((assignment, index) => ({
      ...assignment,
      courseId: courses[0]._id,
      lessonId: lessons[index]?._id || lessons[0]._id // Link to corresponding lesson or first lesson
    }));
    const assignments = await Assignment.insertMany(assignmentsWithCourse);

    // Create enrollments

    const enrollments = [];
    for (const course of courses) {
      for (const student of studentUsers) {
        const isCompleted = Math.random() > 0.7; // 30% chance of completion
        const enrolledAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within 30 days
        
        enrollments.push({
          studentId: student._id,
          courseId: course._id,
          instructorId: course.instructorId,
          enrolledAt: enrolledAt,
          completedAt: isCompleted ? new Date(enrolledAt.getTime() + Math.random() * 20 * 24 * 60 * 60 * 1000) : undefined, // If completed, set completion date after enrollment
          progress: isCompleted ? 100 : Math.floor(Math.random() * 100),
          totalTimeSpent: Math.floor(Math.random() * 20 * 60), // Random time in seconds
          isActive: true,
          isCompleted: isCompleted
        });
      }
    }
    
    // Validate relationships before inserting
    const invalidEnrollments = enrollments.filter(e => 
      !e.studentId || !e.courseId || !e.instructorId
    );
    if (invalidEnrollments.length > 0) {
      throw new Error(`Found ${invalidEnrollments.length} enrollments with invalid relationships`);
    }
    
    await Enrollment.insertMany(enrollments);

    // Create course reviews

    const courseReviews = [];
    for (const course of courses) {
      // Chỉ tạo 2-3 reviews cho mỗi course để tránh duplicate
      const reviewsForCourse = courseReviewsData.slice(0, 3);
      for (let i = 0; i < reviewsForCourse.length; i++) {
        const reviewData = reviewsForCourse[i];
        courseReviews.push({
          ...reviewData,
          courseId: course._id,
          userId: studentUsers[i % studentUsers.length]._id, // Sử dụng student khác nhau
          studentId: studentUsers[i % studentUsers.length]._id
        });
      }
    }
    await CourseReview.insertMany(courseReviews);

    // Create teacher ratings - temporarily disabled due to complex validation requirements


    const teacherRatings = [];
    console.log(`✅ Đã tạo ${teacherRatings.length} teacher ratings (disabled)`);

    // Create comments

    const comments = [];
    const contentTypes = ['course', 'lesson', 'assignment'];
    const contentIds = [courses[0]._id, lessons[0]._id, assignments[0]._id];
    
    for (const commentData of commentsData) {
      const contentType = commentData.contentType as 'course' | 'lesson' | 'assignment';
      const contentIndex = contentTypes.indexOf(contentType);
      const contentId = contentIds[contentIndex] || courses[0]._id;
      
      comments.push({
        ...commentData,
        commentId: `COMMENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        authorId: studentUsers[Math.floor(Math.random() * studentUsers.length)]._id,
        authorType: 'student',
        contentId: contentId,
        contentType: contentType,
        isApproved: true,
        likes: [],
        dislikes: [],
        helpfulVotes: 0,
        totalVotes: 0,
        reports: [],
        isEdited: false,
        editHistory: []
      });
    }
    await Comment.insertMany(comments);

    // Create payments and orders

    const payments = [];
    const orders = [];
    
    for (const enrollment of enrollments.slice(0, 10)) { // Create for first 10 enrollments
      const course = courses.find(c => c._id.equals(enrollment.courseId))!;
      const order = {
        userId: enrollment.studentId,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        amount: course.price,
        currency: 'VND',
        status: 'PAID',
        paymentMethod: 'credit_card',
        createdAt: enrollment.enrolledAt
      };
      orders.push(order);
      
      const payment = {
        orderId: null, // Will be set after order creation
        userId: enrollment.studentId,
        amount: course.price,
        currency: 'VND',
        paymentMethod: 'credit_card',
        status: 'PAID',
        txnRef: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        gateway: 'stripe',
        createdAt: enrollment.enrolledAt
      };
      payments.push(payment);
    }
    
    const createdOrders = await Order.insertMany(orders);

    // Update payments with order IDs
    for (let i = 0; i < payments.length; i++) {
      payments[i].orderId = createdOrders[i]._id;
    }
    await Payment.insertMany(payments);

         // Create certificates for completed enrollments

     const completedEnrollments = enrollments.filter(e => e.isCompleted);
     const certificates = completedEnrollments.map(enrollment => {
       const course = courses.find(c => c._id.equals(enrollment.courseId))!;
       return {
         certificateId: `CERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
         verificationCode: `VER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
         qrCode: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
         courseId: enrollment.courseId,
         studentId: enrollment.studentId,
         instructorId: enrollment.instructorId,
         enrollmentId: enrollment.studentId, // Fallback to studentId since enrollment._id not available
         completionDate: enrollment.completedAt || new Date(), // Use completedAt from enrollment if available
         issueDate: new Date(),
         expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
         finalScore: Math.floor(Math.random() * 30) + 70, // Random score 70-100
         timeSpent: Math.floor(Math.random() * 50) + 20, // Random time 20-70 hours
         certificateType: 'completion',
         level: 'bronze',
         grade: 'A',
         templateId: new mongoose.Types.ObjectId(), // Generate new ObjectId
         customization: {
           backgroundColor: '#FFFFFF',
           borderColor: '#4ECDC4',
           logoUrl: 'https://via.placeholder.com/100x100/4ECDC4/FFFFFF?text=Logo',
           signatureUrl: 'https://via.placeholder.com/200x100/FF6B6B/FFFFFF?text=Signature',
           watermarkUrl: 'https://via.placeholder.com/300x200/96CEB4/FFFFFF?text=Watermark'
         },
         metadata: {
           platformUrl: 'https://lms.example.com',
           platformName: 'LMS Platform',
           instructorName: course.instructorId.toString(), // Will be populated with actual name
           courseLevel: course.level,
           courseDomain: course.domain,
           courseTitle: course.title
         },
         requirementsMet: {
           completionPercentage: 100,
           assignmentsPassed: 3,
           totalAssignments: 3,
           minimumScore: 70,
           achievedScore: Math.floor(Math.random() * 30) + 70,
           timeRequirement: 20,
           timeSpent: Math.floor(Math.random() * 50) + 20
         },
         achievements: [
           {
             name: 'Course Completion',
             description: 'Hoàn thành khóa học thành công',
             iconUrl: 'https://via.placeholder.com/50x50/4ECDC4/FFFFFF?text=🏆',
             earnedDate: new Date()
           }
         ],
         skillsEarned: [
           {
             skillName: 'Web Development',
             proficiencyLevel: 'beginner',
             verifiedDate: new Date()
           }
         ],
         isVerified: true,
         verificationHash: `HASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
         pdfUrl: `https://example.com/certificates/CERT_${Date.now()}.pdf`,
         pdfPath: `/certificates/CERT_${Date.now()}.pdf`,
         fileSize: Math.floor(Math.random() * 1000000) + 500000, // 500KB - 1.5MB
         status: 'active',
         isPublic: true,
         isShareable: true,
         viewCount: 0,
         downloadCount: 0,
         shareCount: 0,
         verificationCount: 0
       };
     });
    await Certificate.insertMany(certificates);



    console.log(`- Users: ${users.length}`);
    console.log(`- Courses: ${courses.length}`);
    console.log(`- Sections: ${sections.length}`);
    console.log(`- Lessons: ${lessons.length}`);
    console.log(`- Assignments: ${assignments.length}`);
    console.log(`- Enrollments: ${enrollments.length}`);
    console.log(`- Course Reviews: ${courseReviews.length}`);
    console.log(`- Teacher Ratings: ${teacherRatings.length}`);
    console.log(`- Comments: ${comments.length}`);
    console.log(`- Orders: ${createdOrders.length}`);
    console.log(`- Payments: ${payments.length}`);
    console.log(`- Certificates: ${certificates.length}`);

  } catch (error) {

    throw error;
  } finally {
    await mongoose.disconnect();

  }
}

// Run seeding
if (require.main === module) {
  seedDatabase()
    .then(() => {

      process.exit(0);
    })
    .catch((error) => {

      process.exit(1);
    });
}

export default seedDatabase;
