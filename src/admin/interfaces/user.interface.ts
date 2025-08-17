export interface User {
  _id: string;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
  avatar?: string;
  phone?: string;
  country?: string;
  bio?: string;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: Date;
  emailVerified?: boolean;
  dateOfBirth?: Date;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    youtube?: string;
  };
  preferences?: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  stats?: {
    totalCoursesEnrolled: number;
    totalCoursesCompleted: number;
    totalAssignmentsSubmitted: number;
    averageScore: number;
    totalLearningTime: number;
  };
  lastLoginAt?: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  roles: string[];
  phone?: string;
  country?: string;
  bio?: string;
  subscriptionPlan?: string;
}

export interface UpdateUserRequest {
  name?: string;
  roles?: string[];
  isActive?: boolean;
  phone?: string;
  country?: string;
  bio?: string;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: Date;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Array<{ role: string; count: number }>;
  newUsersThisMonth: number;
  activeUsersThisWeek: number;
}

export interface UserSearchFilters {
  search?: string;
  roles?: string[];
  isActive?: boolean;
  createdAt?: {
    start: Date;
    end: Date;
  };
  lastActivityAt?: {
    start: Date;
    end: Date;
  };
}
