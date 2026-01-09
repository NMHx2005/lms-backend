import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../models/core/User';

export interface SocketUser {
  userId: string;
  socketId: string;
  role: string;
  firstName: string;
  lastName: string;
  connectedAt: Date;
}

export interface NotificationData {
  type: 'info' | 'success' | 'warning' | 'error' | 'course' | 'assignment' | 'payment' | 'announcement';
  title: string;
  message: string;
  userId?: string;
  courseId?: string;
  assignmentId?: string;
  metadata?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  expiresAt?: Date;
}

export interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'course' | 'urgent' | 'maintenance' | 'update';
  target: {
    type: 'all' | 'role' | 'course' | 'user';
    value?: string | string[];
  };
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: Date;
  expiresAt?: Date;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map(); // userId -> SocketUser
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN_PRODUCTION?.split(',') || process.env.CORS_ORIGIN_DEVELOPMENT?.split(',') || "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true
    });

    this.setupMiddleware();
    this.setupEventHandlers();

  }

  private setupMiddleware(): void {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('No authentication token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.id).select('firstName lastName email role');

        if (!user) {
          return next(new Error('User not found'));
        }

        // Attach user to socket
        (socket as any).userId = user._id.toString();
        (socket as any).userRole = user.role;
        (socket as any).userName = `${user.firstName} ${user.lastName}`;

        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket & { userId?: string; userRole?: string; userName?: string }) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: Socket & { userId?: string; userRole?: string; userName?: string }): void {
    if (!socket.userId) return;

    console.log(`👤 User connected: ${socket.userName} (${socket.userId})`);

    // Store connected user
    const socketUser: SocketUser = {
      userId: socket.userId,
      socketId: socket.id,
      role: socket.userRole || 'student',
      firstName: socket.userName?.split(' ')[0] || '',
      lastName: socket.userName?.split(' ').slice(1).join(' ') || '',
      connectedAt: new Date()
    };

    this.connectedUsers.set(socket.userId, socketUser);
    this.socketToUser.set(socket.id, socket.userId);

    // Join user-specific room
    socket.join(`user_${socket.userId}`);
    
    // Join role-specific room
    socket.join(`role_${socket.userRole}`);

    // Handle events
    this.setupSocketEvents(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Send welcome notification
    this.sendToUser(socket.userId, {
      type: 'info',
      title: 'Kết nối thành công',
      message: 'Bạn đã kết nối thành công đến hệ thống thông báo real-time',
      priority: 'low'
    });

    // Send unread notifications count
    this.sendUnreadNotificationsCount(socket.userId);
  }

  private setupSocketEvents(socket: Socket & { userId?: string; userRole?: string }): void {
    // Join course room
    socket.on('join_course', (courseId: string) => {
      socket.join(`course_${courseId}`);
      console.log(`👤 ${(socket as any).userName} joined course room: ${courseId}`);
    });

    // Leave course room
    socket.on('leave_course', (courseId: string) => {
      socket.leave(`course_${courseId}`);
      console.log(`👤 ${(socket as any).userName} left course room: ${courseId}`);
    });

    // Mark notification as read
    socket.on('mark_notification_read', async (notificationId: string) => {
      try {
        // Update notification in database
        const Notification = require('../../models/extended/Notification').default;
        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
        
        // Send updated count
        this.sendUnreadNotificationsCount(socket.userId!);
      } catch (error) {

      }
    });

    // Request notifications history
    socket.on('get_notifications', async (data: { page?: number; limit?: number }) => {
      try {
        const Notification = require('../../models/extended/Notification').default;
        const { page = 1, limit = 20 } = data;
        
        const notifications = await Notification.findByUser(
          new mongoose.Types.ObjectId(socket.userId!), 
          { 
            archived: false, 
            limit, 
            skip: (page - 1) * limit 
          }
        );

        socket.emit('notifications_history', {
          notifications,
          page,
          hasMore: notifications.length === limit
        });
      } catch (error) {

      }
    });

    // Typing indicator for course chat (future feature)
    socket.on('typing_start', (data: { courseId: string }) => {
      socket.to(`course_${data.courseId}`).emit('user_typing', {
        userId: socket.userId,
        userName: (socket as any).userName,
        courseId: data.courseId
      });
    });

    socket.on('typing_stop', (data: { courseId: string }) => {
      socket.to(`course_${data.courseId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        courseId: data.courseId
      });
    });

    // Heartbeat
    socket.on('ping', () => {
      socket.emit('pong');
    });
  }

  private handleDisconnection(socket: Socket & { userId?: string }): void {
    if (socket.userId) {

      this.connectedUsers.delete(socket.userId);
      this.socketToUser.delete(socket.id);
    }
  }

  // Send notification to specific user
  sendToUser(userId: string, notification: NotificationData): boolean {
    if (!this.io) return false;

    try {
      this.io.to(`user_${userId}`).emit('notification', {
        ...notification,
        timestamp: new Date(),
        id: new mongoose.Types.ObjectId().toString()
      });

      return true;
    } catch (error) {

      return false;
    }
  }

  // Send notification to users by role
  sendToRole(role: string, notification: NotificationData): boolean {
    if (!this.io) return false;

    try {
      this.io.to(`role_${role}`).emit('notification', {
        ...notification,
        timestamp: new Date(),
        id: new mongoose.Types.ObjectId().toString()
      });

      return true;
    } catch (error) {

      return false;
    }
  }

  // Send notification to course members
  sendToCourse(courseId: string, notification: NotificationData): boolean {
    if (!this.io) return false;

    try {
      this.io.to(`course_${courseId}`).emit('notification', {
        ...notification,
        courseId,
        timestamp: new Date(),
        id: new mongoose.Types.ObjectId().toString()
      });

      return true;
    } catch (error) {

      return false;
    }
  }

  // Broadcast to all connected users
  broadcast(notification: NotificationData): boolean {
    if (!this.io) return false;

    try {
      this.io.emit('notification', {
        ...notification,
        timestamp: new Date(),
        id: new mongoose.Types.ObjectId().toString()
      });

      return true;
    } catch (error) {

      return false;
    }
  }

  // Send announcement
  sendAnnouncement(announcement: AnnouncementData): boolean {
    if (!this.io) return false;

    try {
      const { target } = announcement;

      switch (target.type) {
        case 'all':
          this.io.emit('announcement', announcement);
          break;
        case 'role':
          if (target.value) {
            this.io.to(`role_${target.value}`).emit('announcement', announcement);
          }
          break;
        case 'course':
          if (target.value) {
            this.io.to(`course_${target.value}`).emit('announcement', announcement);
          }
          break;
        case 'user':
          if (target.value) {
            const userIds = Array.isArray(target.value) ? target.value : [target.value];
            userIds.forEach(userId => {
              this.io!.to(`user_${userId}`).emit('announcement', announcement);
            });
          }
          break;
      }

      return true;
    } catch (error) {

      return false;
    }
  }

  // Send live course updates (lesson progress, live sessions)
  sendCourseUpdate(courseId: string, updateData: {
    type: 'lesson_progress' | 'live_session' | 'assignment_released' | 'deadline_reminder';
    data: any;
  }): boolean {
    if (!this.io) return false;

    try {
      this.io.to(`course_${courseId}`).emit('course_update', {
        courseId,
        ...updateData,
        timestamp: new Date()
      });

      return true;
    } catch (error) {

      return false;
    }
  }

  // Send assignment notifications
  sendAssignmentUpdate(assignmentId: string, courseId: string, updateData: {
    type: 'released' | 'due_reminder' | 'graded';
    title: string;
    message: string;
    dueDate?: Date;
    grade?: number;
  }): boolean {
    if (!this.io) return false;

    try {
      this.io.to(`course_${courseId}`).emit('assignment_update', {
        assignmentId,
        courseId,
        ...updateData,
        timestamp: new Date()
      });

      return true;
    } catch (error) {

      return false;
    }
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users by role
  getConnectedUsersByRole(role: string): SocketUser[] {
    return Array.from(this.connectedUsers.values()).filter(user => user.role === role);
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Send unread notifications count
  private async sendUnreadNotificationsCount(userId: string): Promise<void> {
    try {
      const Notification = require('../../models/extended/Notification').default;
      const count = await Notification.findUnreadCount(new mongoose.Types.ObjectId(userId));
      
      this.sendToUser(userId, {
        type: 'info',
        title: 'Unread Count',
        message: `${count}`,
        metadata: { type: 'unread_count', count },
        priority: 'low'
      });
    } catch (error) {

    }
  }

  // Get WebSocket stats
  getStats() {
    const usersByRole: { [key: string]: number } = {};
    Array.from(this.connectedUsers.values()).forEach(user => {
      usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
    });

    return {
      totalConnected: this.connectedUsers.size,
      usersByRole,
      isServerRunning: !!this.io
    };
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();
