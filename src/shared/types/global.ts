// Global type declarations for the LMS backend

import { Request } from 'express';

// Define custom user type for LMS
export interface LMSUser {
  id: string;
  email: string;
  roles: string[];
  isActive: boolean;
  firstName: string;
  lastName: string;
  role: string;
}

// Authenticated Request type that extends Express Request
export interface AuthenticatedRequest extends Request {
  user: LMSUser;
}

// MongoDB ObjectId type
export type ObjectId = string;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pagination query parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Search query parameters
export interface SearchQuery extends PaginationQuery {
  q?: string;
  domain?: string;
  level?: string;
  price?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
  language?: string;
}

// File upload types
export interface FileUploadConfig {
  maxSize: number;
  allowedTypes: string[];
  uploadPath: string;
}

// Authentication types
export interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

// Role types
export type UserRole = 'admin' | 'teacher' | 'student';
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'advanced';

// Course status types
export type CourseStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'published'
  | 'archived';

// Assignment types
export type AssignmentType = 'file' | 'quiz' | 'text';
export type QuestionType = 'multiple-choice' | 'text' | 'file';

// Payment types
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'stripe' | 'paypal' | 'bank_transfer';

// Notification types
export type NotificationType = 'email' | 'push' | 'sms';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export {};
