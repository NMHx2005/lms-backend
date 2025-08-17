export interface SystemOverview {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  pendingRefunds: number;
  systemHealth: SystemHealth;
}

export interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  email: 'healthy' | 'warning' | 'error';
  payment: 'healthy' | 'warning' | 'error';
}

export interface RefundRequest {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  courseId: {
    _id: string;
    title: string;
  };
  billId: {
    _id: string;
    amount: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  adminNotes?: string;
  processedBy?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundListResponse {
  success: boolean;
  data: RefundRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProcessRefundRequest {
  status: 'approved' | 'rejected';
  adminNotes?: string;
}

export interface SystemLog {
  id: string;
  action: string;
  resource: string;
  userId: string;
  ipAddress: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  createdAt: Date;
}

export interface SystemSettings {
  siteName: string;
  maintenanceMode: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  emailNotifications: boolean;
  paymentEnabled: boolean;
}

export interface UpdateSystemSettingsRequest {
  maintenanceMode?: boolean;
  maxFileSize?: number;
  emailNotifications?: boolean;
}

export interface BackupStatus {
  lastBackup: Date;
  nextBackup: Date;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  size: string;
  type: 'full' | 'incremental';
}

export interface SystemQueryFilters {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  type?: string;
}
