export interface Course {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  domain: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  totalDuration: number; // in minutes
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  status?: 'draft' | 'submitted' | 'approved' | 'published' | 'rejected' | 'needs_revision' | 'delisted';
  hasUnsavedChanges?: boolean;
  isPublished: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  instructorId: string;
  instructorName: string;
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

export interface CreateCourseRequest {
  title: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  domain: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  totalDuration: number;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  instructorId: string;
  tags: string[];
  prerequisites: string[];
  benefits: string[];
  relatedLinks: string[];
  language: string;
  certificate: boolean;
  maxStudents?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;
  domain?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  totalDuration?: number;
  price?: number;
  originalPrice?: number;
  discountPercentage?: number;
  tags?: string[];
  prerequisites?: string[];
  benefits?: string[];
  relatedLinks?: string[];
  language?: string;
  certificate?: boolean;
  maxStudents?: number;
  startDate?: Date;
  endDate?: Date;
  isPublished?: boolean;
  isApproved?: boolean;
  isFeatured?: boolean;
}

export interface CourseListResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  pendingApproval: number;
  draftCourses: number;
  coursesByDomain: Array<{ domain: string; count: number }>;
  coursesByLevel: Array<{ level: string; count: number }>;
  averageRating: number;
  totalEnrollments: number;
  totalRevenue: number;
}

export interface CourseSearchFilters {
  search?: string;
  domain?: string;
  level?: string;
  status?: string; // NEW: draft, submitted, approved, published, rejected, needs_revision, delisted
  isPublished?: boolean;
  isApproved?: boolean;
  isFeatured?: boolean;
  submittedForReview?: boolean;
  instructorId?: string;
  instructor?: string;
  minPrice?: number;
  maxPrice?: number;
  createdAt?: {
    start: Date;
    end: Date;
  };
}

export interface CourseApprovalRequest {
  courseId: string;
  approved: boolean;
  feedback?: string;
}
