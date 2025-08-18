import mongoose, { Schema, Document } from 'mongoose';

export type ReportFormat = 'csv' | 'pdf';

export interface IReportSchedule extends Document {
  name: string;
  type: string; // e.g., users, revenue, courses
  format: ReportFormat;
  cron: string; // cron expression
  recipients: string[];
  creatorId: mongoose.Types.ObjectId;
  lastRunAt?: Date;
  nextRunAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reportScheduleSchema = new Schema<IReportSchedule>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    format: { type: String, enum: ['csv', 'pdf'], default: 'csv' },
    cron: { type: String, required: true },
    recipients: { type: [String], default: [] },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastRunAt: { type: Date },
    nextRunAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reportScheduleSchema.index({ creatorId: 1, isActive: 1 });

export default mongoose.model<IReportSchedule>('ReportSchedule', reportScheduleSchema);


