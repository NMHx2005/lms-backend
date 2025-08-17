export interface DashboardAnalytics {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  pendingCourses: number;
  activeUsers: number;
  averageRevenue: number;
}

export interface UserAnalytics {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  usersByRole: Array<{ _id: string; count: number }>;
  retentionRate: number;
}

export interface CourseAnalytics {
  totalCourses: number;
  publishedCourses: number;
  pendingCourses: number;
  coursesByDomain: Array<{ _id: string; count: number }>;
  averageRating: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  revenueByCourse: Array<{ courseId: string; courseName: string; revenue: number }>;
  averageOrderValue: number;
}

export interface EnrollmentAnalytics {
  totalEnrollments: number;
  newEnrollments: number;
  completionRate: number;
  enrollmentsByCourse: Array<{ courseId: string; courseName: string; enrollments: number }>;
}
