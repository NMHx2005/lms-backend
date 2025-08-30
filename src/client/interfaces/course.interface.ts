export interface Course {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  domain: string;
  level: string;
  totalDuration: number;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  isPublished: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  instructorId: string;
  instructorName: string;
  instructorEmail?: string;
  instructorAvatar?: string;
  totalStudents: number;
  averageRating: number;
  totalLessons: number;
  tags: string[];
  prerequisites: string[];
  benefits: string[];
  relatedLinks: string[];
  language: string;
  certificate: boolean;
  maxStudents?: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  approvedAt?: Date;
}

export interface CourseListResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseSearchFilters {
  search?: string;
  domain?: string;
  level?: string;
  instructorId?: string;
  minPrice?: number;
  maxPrice?: number;
  isFree?: boolean;
  isFeatured?: boolean;
  language?: string;
  certificate?: boolean;
  minRating?: number;
  minDuration?: number;
  maxDuration?: number;
  createdAt?: {
    start: Date;
    end: Date;
  };
}

export interface CourseContent {
  course: any; // Course model with populated fields
  enrollment: any; // Enrollment model
  progress: number;
  completedLessons: string[];
  currentLesson?: string;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  currentLesson?: string;
  lastAccessed: Date;
  enrollmentDate: Date;
  status: string;
}

export interface EnrollmentRequest {
  courseId: string;
  userId: string;
  paymentMethod?: string;
  couponCode?: string;
}
