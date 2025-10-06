import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportTicket extends Document {
    ticketNumber: string;
    userId: string;
    userName: string;
    userEmail: string;
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
    category: 'technical' | 'billing' | 'course' | 'account' | 'general';
    assignedTo?: string;
    assignedToName?: string;
    lastResponseAt?: Date;
    responseCount: number;
    tags: string[];
    notes: Array<{
        note: string;
        isInternal: boolean;
        addedBy: string;
        addedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>({
    ticketNumber: {
        type: String,
        required: [true, 'Ticket number là bắt buộc'],
        unique: true,
        trim: true
    },
    userId: {
        type: String,
        required: [true, 'User ID là bắt buộc']
    },
    userName: {
        type: String,
        required: [true, 'User name là bắt buộc'],
        trim: true
    },
    userEmail: {
        type: String,
        required: [true, 'User email là bắt buộc'],
        trim: true
    },
    subject: {
        type: String,
        required: [true, 'Subject là bắt buộc'],
        trim: true,
        maxlength: [200, 'Subject không được vượt quá 200 ký tự']
    },
    description: {
        type: String,
        required: [true, 'Description là bắt buộc'],
        trim: true,
        maxlength: [2000, 'Description không được vượt quá 2000 ký tự']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'],
        default: 'open'
    },
    category: {
        type: String,
        enum: ['technical', 'billing', 'course', 'account', 'general'],
        required: [true, 'Category là bắt buộc']
    },
    assignedTo: {
        type: String,
        default: null
    },
    assignedToName: {
        type: String,
        default: null
    },
    lastResponseAt: {
        type: Date
    },
    responseCount: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    notes: [{
        note: { type: String, required: true, trim: true },
        isInternal: { type: Boolean, default: true },
        addedBy: { type: String, required: true },
        addedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
SupportTicketSchema.index({ ticketNumber: 1 });
SupportTicketSchema.index({ userId: 1 });
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ priority: 1 });
SupportTicketSchema.index({ category: 1 });
SupportTicketSchema.index({ assignedTo: 1 });
SupportTicketSchema.index({ createdAt: -1 });

// Pre-save middleware to generate ticket number
SupportTicketSchema.pre('save', async function (next) {
    if (this.isNew && !this.ticketNumber) {
        const count = await mongoose.model('SupportTicket').countDocuments();
        this.ticketNumber = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

export default mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
