// User Profile Management
export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  phone?: string;
  dateOfBirth?: Date;
  country?: string;
  avatar?: string;
  socialLinks?: SocialLinks;
  preferences?: UserPreferences;
  skills?: string[];
  education?: Education[];
  experience?: Experience[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdatePreferencesRequest {
  language?: string;
  timezone?: string;
  notifications?: NotificationSettings;
  learningGoals?: string[];
  theme?: 'light' | 'dark' | 'auto';
  accessibility?: AccessibilitySettings;
}

export interface UpdateNotificationSettingsRequest {
  email: boolean;
  push: boolean;
  sms: boolean;
  courseUpdates: boolean;
  assignmentReminders: boolean;
  achievementNotifications: boolean;
  marketingEmails: boolean;
}

export interface UpdateSocialLinksRequest {
  linkedin?: string;
  twitter?: string;
  github?: string;
  youtube?: string;
  website?: string;
  portfolio?: string;
}

// User Data Structures
export interface UserProfile {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  roles: string[];
  subscriptionPlan: string;
  subscriptionExpiresAt?: Date;
  isActive: boolean;
  emailVerified: boolean;
  phone?: string;
  dateOfBirth?: Date;
  country?: string;
  bio?: string;
  skills?: string[];
  education?: Education[];
  experience?: Experience[];
  socialLinks?: SocialLinks;
  preferences?: UserPreferences;
  stats?: UserStats;
  enrolledCourses?: any[];
  completedCourses?: any[];
  favoriteCourses?: any[];
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserLearningStats {
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalAssignmentsSubmitted: number;
  averageScore: number;
  totalLearningTime: number;
  currentStreak: number;
  totalCertificates: number;
  favoriteCategories: string[];
  learningGoals: string[];
}

export interface UserActivityLog {
  activities: UserActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserActivity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface UserSubscriptionInfo {
  plan: string;
  expiresAt?: Date;
  isActive: boolean;
  features: string[];
  nextBillingDate?: Date;
  autoRenew: boolean;
}

// Supporting Interfaces
export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  youtube?: string;
  website?: string;
  portfolio?: string;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
  learningGoals: string[];
  accessibility: AccessibilitySettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  courseUpdates: boolean;
  assignmentReminders: boolean;
  achievementNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  monthlyReport: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  reducedMotion: boolean;
  colorBlindFriendly: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showLearningProgress: boolean;
  allowDataAnalytics: boolean;
  allowMarketing: boolean;
}

export interface UserStats {
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalAssignmentsSubmitted: number;
  averageScore: number;
  totalLearningTime: number;
  totalCertificates: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  level: number;
  achievements: string[];
}

// Password Reset and Email Verification
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

// Response Interfaces
export interface UserProfileResponse {
  success: boolean;
  data: UserProfile;
}

export interface UserProfileUpdateResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

export interface PasswordChangeResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
}

export interface UserPreferencesResponse {
  success: boolean;
  message: string;
  data: UserPreferences;
}

export interface UserStatsResponse {
  success: boolean;
  data: UserLearningStats;
}

export interface UserActivityResponse {
  success: boolean;
  data: UserActivityLog;
}

export interface UserSubscriptionResponse {
  success: boolean;
  data: UserSubscriptionInfo;
}

export interface AvatarUpdateResponse {
  success: boolean;
  message: string;
  data: { avatar: string };
}

export interface AccountDeletionResponse {
  success: boolean;
  message: string;
}

export interface SocialLinksResponse {
  success: boolean;
  message: string;
  data: SocialLinks;
}
