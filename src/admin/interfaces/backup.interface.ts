export interface Backup {
    _id: string;
    name: string;
    description?: string;
    type: 'full' | 'incremental';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    size: string;
    filePath: string;
    createdAt: Date;
    completedAt?: Date;
    createdBy: string;
    errorMessage?: string;
    includeFiles: boolean;
    metadata?: {
        collections: string[];
        recordCount: number;
        fileCount?: number;
    };
}

export interface RestoreJob {
    _id: string;
    name: string;
    description?: string;
    backupId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    createdBy: string;
    errorMessage?: string;
    progress: number; // 0-100
}

export interface BackupSchedule {
    _id: string;
    name: string;
    description?: string;
    cronExpression: string;
    type: 'full' | 'incremental';
    enabled: boolean;
    lastRun?: Date;
    nextRun: Date;
    createdAt: Date;
    createdBy: string;
    settings?: {
        includeFiles: boolean;
        retentionDays: number;
        maxBackups: number;
    };
}

export interface BackupSettings {
    _id: string;
    storageType: 'local' | 's3' | 'azure' | 'gcp';
    storageConfig: {
        local?: {
            path: string;
        };
        s3?: {
            bucket: string;
            region: string;
            accessKeyId: string;
            secretAccessKey: string;
        };
        azure?: {
            accountName: string;
            accountKey: string;
            containerName: string;
        };
        gcp?: {
            projectId: string;
            bucketName: string;
            keyFilename: string;
        };
    };
    defaultRetentionDays: number;
    maxBackups: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
    encryptionKey?: string;
    notificationSettings: {
        email: string[];
        onSuccess: boolean;
        onFailure: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateBackupRequest {
    name: string;
    description?: string;
    type?: 'full' | 'incremental';
    includeFiles?: boolean;
    createdBy: string;
}

export interface CreateRestoreJobRequest {
    name: string;
    description?: string;
    createdBy: string;
}

export interface CreateBackupScheduleRequest {
    name: string;
    description?: string;
    cronExpression: string;
    type?: 'full' | 'incremental';
    enabled?: boolean;
    createdBy: string;
    settings?: {
        includeFiles?: boolean;
        retentionDays?: number;
        maxBackups?: number;
    };
}

export interface BackupQueryFilters {
    page: number;
    limit: number;
    status?: string;
    type?: string;
}

export interface RestoreJobQueryFilters {
    page: number;
    limit: number;
    status?: string;
}

export interface BackupScheduleQueryFilters {
    page: number;
    limit: number;
    status?: string;
}

export interface BackupListResponse {
    backups: Backup[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface RestoreJobListResponse {
    restoreJobs: RestoreJob[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface BackupScheduleListResponse {
    schedules: BackupSchedule[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
