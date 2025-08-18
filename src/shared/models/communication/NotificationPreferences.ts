import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Email preferences
  email: {
    enabled: boolean;
    courseUpdates: boolean;
    assignmentReminders: boolean;
    gradeNotifications: boolean;
    announcementNotifications: boolean;
    billingNotifications: boolean;
    marketingEmails: boolean;
    weeklyDigest: boolean;
    monthlyReport: boolean;
    urgentOnly: boolean;
  };
  
  // Push notification preferences
  push: {
    enabled: boolean;
    courseUpdates: boolean;
    assignmentReminders: boolean;
    gradeNotifications: boolean;
    announcementNotifications: boolean;
    realTimeUpdates: boolean;
    urgentOnly: boolean;
  };
  
  // In-app notification preferences
  inApp: {
    enabled: boolean;
    courseUpdates: boolean;
    assignmentReminders: boolean;
    gradeNotifications: boolean;
    announcementNotifications: boolean;
    realTimeUpdates: boolean;
    showPopups: boolean;
    playSound: boolean;
    urgentOnly: boolean;
  };
  
  // General preferences
  general: {
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'none';
    quietHours: {
      enabled: boolean;
      startTime: string; // HH:MM format
      endTime: string; // HH:MM format
      timezone: string;
    };
    language: 'vi' | 'en';
    batchNotifications: boolean;
    maxNotificationsPerDay: number;
  };
  
  // Course-specific preferences
  coursePreferences: {
    courseId: mongoose.Types.ObjectId;
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    priority: 'high' | 'normal' | 'low' | 'muted';
  }[];
  
  // Unsubscribe tokens
  unsubscribeTokens: {
    email: string;
    push: string;
    createdAt: Date;
    expiresAt: Date;
  };
  
  // Analytics
  analytics: {
    lastEmailSent: Date;
    lastPushSent: Date;
    totalEmailsSent: number;
    totalPushesSent: number;
    lastInteraction: Date;
    clickThroughRate: number;
    openRate: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferencesSchema = new Schema<INotificationPreferences>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true
    },
    
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      courseUpdates: {
        type: Boolean,
        default: true
      },
      assignmentReminders: {
        type: Boolean,
        default: true
      },
      gradeNotifications: {
        type: Boolean,
        default: true
      },
      announcementNotifications: {
        type: Boolean,
        default: true
      },
      billingNotifications: {
        type: Boolean,
        default: true
      },
      marketingEmails: {
        type: Boolean,
        default: false
      },
      weeklyDigest: {
        type: Boolean,
        default: true
      },
      monthlyReport: {
        type: Boolean,
        default: false
      },
      urgentOnly: {
        type: Boolean,
        default: false
      }
    },
    
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      courseUpdates: {
        type: Boolean,
        default: true
      },
      assignmentReminders: {
        type: Boolean,
        default: true
      },
      gradeNotifications: {
        type: Boolean,
        default: true
      },
      announcementNotifications: {
        type: Boolean,
        default: true
      },
      realTimeUpdates: {
        type: Boolean,
        default: true
      },
      urgentOnly: {
        type: Boolean,
        default: false
      }
    },
    
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      courseUpdates: {
        type: Boolean,
        default: true
      },
      assignmentReminders: {
        type: Boolean,
        default: true
      },
      gradeNotifications: {
        type: Boolean,
        default: true
      },
      announcementNotifications: {
        type: Boolean,
        default: true
      },
      realTimeUpdates: {
        type: Boolean,
        default: true
      },
      showPopups: {
        type: Boolean,
        default: true
      },
      playSound: {
        type: Boolean,
        default: false
      },
      urgentOnly: {
        type: Boolean,
        default: false
      }
    },
    
    general: {
      frequency: {
        type: String,
        enum: ['immediate', 'hourly', 'daily', 'weekly', 'none'],
        default: 'immediate'
      },
      quietHours: {
        enabled: {
          type: Boolean,
          default: false
        },
        startTime: {
          type: String,
          default: '22:00',
          validate: {
            validator: function(time: string) {
              return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
            },
            message: 'Invalid time format. Use HH:MM'
          }
        },
        endTime: {
          type: String,
          default: '08:00',
          validate: {
            validator: function(time: string) {
              return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
            },
            message: 'Invalid time format. Use HH:MM'
          }
        },
        timezone: {
          type: String,
          default: 'Asia/Ho_Chi_Minh'
        }
      },
      language: {
        type: String,
        enum: ['vi', 'en'],
        default: 'vi'
      },
      batchNotifications: {
        type: Boolean,
        default: false
      },
      maxNotificationsPerDay: {
        type: Number,
        default: 50,
        min: 1,
        max: 200
      }
    },
    
    coursePreferences: [{
      courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
      },
      emailEnabled: {
        type: Boolean,
        default: true
      },
      pushEnabled: {
        type: Boolean,
        default: true
      },
      inAppEnabled: {
        type: Boolean,
        default: true
      },
      priority: {
        type: String,
        enum: ['high', 'normal', 'low', 'muted'],
        default: 'normal'
      }
    }],
    
    unsubscribeTokens: {
      email: {
        type: String,
        default: () => require('crypto').randomBytes(32).toString('hex')
      },
      push: {
        type: String,
        default: () => require('crypto').randomBytes(32).toString('hex')
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }
    },
    
    analytics: {
      lastEmailSent: {
        type: Date
      },
      lastPushSent: {
        type: Date
      },
      totalEmailsSent: {
        type: Number,
        default: 0,
        min: 0
      },
      totalPushesSent: {
        type: Number,
        default: 0,
        min: 0
      },
      lastInteraction: {
        type: Date
      },
      clickThroughRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      openRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
NotificationPreferencesSchema.index({ userId: 1 });
NotificationPreferencesSchema.index({ 'unsubscribeTokens.email': 1 });
NotificationPreferencesSchema.index({ 'unsubscribeTokens.push': 1 });
NotificationPreferencesSchema.index({ 'coursePreferences.courseId': 1 });

// Virtual for total notifications sent
NotificationPreferencesSchema.virtual('totalNotificationsSent').get(function(this: INotificationPreferences) {
  return this.analytics.totalEmailsSent + this.analytics.totalPushesSent;
});

// Virtual for engagement rate
NotificationPreferencesSchema.virtual('engagementRate').get(function(this: INotificationPreferences) {
  const total = this.analytics.totalEmailsSent + this.analytics.totalPushesSent;
  if (total === 0) return 0;
  
  const engagements = (this.analytics.clickThroughRate + this.analytics.openRate) / 2;
  return Math.round(engagements);
});

// Static methods
NotificationPreferencesSchema.statics.findByUserId = function(userId: mongoose.Types.ObjectId) {
  return this.findOne({ userId });
};

NotificationPreferencesSchema.statics.findByUnsubscribeToken = function(token: string, type: 'email' | 'push') {
  const query = type === 'email' 
    ? { 'unsubscribeTokens.email': token }
    : { 'unsubscribeTokens.push': token };
    
  return this.findOne(query);
};

NotificationPreferencesSchema.statics.createDefault = function(userId: mongoose.Types.ObjectId) {
  return this.create({ userId });
};

// Instance methods
NotificationPreferencesSchema.methods.canReceiveEmail = function(type: string, courseId?: string): boolean {
  if (!this.email.enabled) return false;
  
  // Check course-specific preferences
  if (courseId) {
    const coursePrefs = this.coursePreferences.find(
      (pref: any) => pref.courseId.toString() === courseId
    );
    if (coursePrefs && (!coursePrefs.emailEnabled || coursePrefs.priority === 'muted')) {
      return false;
    }
  }
  
  // Check type-specific preferences
  switch (type) {
    case 'course_update':
      return this.email.courseUpdates;
    case 'assignment_reminder':
      return this.email.assignmentReminders;
    case 'grade_notification':
      return this.email.gradeNotifications;
    case 'announcement':
      return this.email.announcementNotifications;
    case 'billing':
      return this.email.billingNotifications;
    case 'marketing':
      return this.email.marketingEmails;
    case 'weekly_digest':
      return this.email.weeklyDigest;
    case 'monthly_report':
      return this.email.monthlyReport;
    default:
      return true;
  }
};

NotificationPreferencesSchema.methods.canReceivePush = function(type: string, courseId?: string): boolean {
  if (!this.push.enabled) return false;
  
  // Check course-specific preferences
  if (courseId) {
    const coursePrefs = this.coursePreferences.find(
      (pref: any) => pref.courseId.toString() === courseId
    );
    if (coursePrefs && (!coursePrefs.pushEnabled || coursePrefs.priority === 'muted')) {
      return false;
    }
  }
  
  // Check type-specific preferences
  switch (type) {
    case 'course_update':
      return this.push.courseUpdates;
    case 'assignment_reminder':
      return this.push.assignmentReminders;
    case 'grade_notification':
      return this.push.gradeNotifications;
    case 'announcement':
      return this.push.announcementNotifications;
    case 'real_time':
      return this.push.realTimeUpdates;
    default:
      return true;
  }
};

NotificationPreferencesSchema.methods.canReceiveInApp = function(type: string, courseId?: string): boolean {
  if (!this.inApp.enabled) return false;
  
  // Check course-specific preferences
  if (courseId) {
    const coursePrefs = this.coursePreferences.find(
      (pref: any) => pref.courseId.toString() === courseId
    );
    if (coursePrefs && (!coursePrefs.inAppEnabled || coursePrefs.priority === 'muted')) {
      return false;
    }
  }
  
  // Check type-specific preferences
  switch (type) {
    case 'course_update':
      return this.inApp.courseUpdates;
    case 'assignment_reminder':
      return this.inApp.assignmentReminders;
    case 'grade_notification':
      return this.inApp.gradeNotifications;
    case 'announcement':
      return this.inApp.announcementNotifications;
    case 'real_time':
      return this.inApp.realTimeUpdates;
    default:
      return true;
  }
};

NotificationPreferencesSchema.methods.isQuietTime = function(): boolean {
  if (!this.general.quietHours.enabled) return false;
  
  const now = new Date();
  const timezone = this.general.quietHours.timezone || 'Asia/Ho_Chi_Minh';
  
  // Convert current time to user's timezone
  const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const currentHour = userTime.getHours();
  const currentMinute = userTime.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const [startHour, startMinute] = this.general.quietHours.startTime.split(':').map(Number);
  const [endHour, endMinute] = this.general.quietHours.endTime.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    return currentTime >= startTime && currentTime <= endTime;
  }
};

NotificationPreferencesSchema.methods.updateCoursePreference = function(
  courseId: mongoose.Types.ObjectId,
  preferences: Partial<{ emailEnabled: boolean; pushEnabled: boolean; inAppEnabled: boolean; priority: string }>
) {
  const existingIndex = this.coursePreferences.findIndex(
    (pref: any) => pref.courseId.toString() === courseId.toString()
  );
  
  if (existingIndex >= 0) {
    Object.assign(this.coursePreferences[existingIndex], preferences);
  } else {
    this.coursePreferences.push({
      courseId,
      ...preferences,
      emailEnabled: preferences.emailEnabled ?? true,
      pushEnabled: preferences.pushEnabled ?? true,
      inAppEnabled: preferences.inAppEnabled ?? true,
      priority: preferences.priority ?? 'normal'
    });
  }
  
  return this.save();
};

NotificationPreferencesSchema.methods.recordEmailSent = function() {
  this.analytics.lastEmailSent = new Date();
  this.analytics.totalEmailsSent += 1;
  return this.save();
};

NotificationPreferencesSchema.methods.recordPushSent = function() {
  this.analytics.lastPushSent = new Date();
  this.analytics.totalPushesSent += 1;
  return this.save();
};

NotificationPreferencesSchema.methods.recordInteraction = function() {
  this.analytics.lastInteraction = new Date();
  return this.save();
};

export default mongoose.model<INotificationPreferences>('NotificationPreferences', NotificationPreferencesSchema);
