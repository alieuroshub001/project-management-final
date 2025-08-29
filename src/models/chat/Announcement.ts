// models/chat/Announcement.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

// Announcement Document Interface
export interface IAnnouncementDocument extends Document {
  chatId?: mongoose.Types.ObjectId;
  title: string;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  createdByEmail: string;
  priority: string;
  targetAudience: string;
  targetUserIds?: mongoose.Types.ObjectId[];
  targetRoles?: string[];
  attachments?: Array<{
    public_id: string;
    secure_url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
    original_filename: string;
    created_at: string;
  }>;
  isActive: boolean;
  isPinned: boolean;
  pinnedUntil?: Date;
  readBy: Array<{
    userId: mongoose.Types.ObjectId;
    userName: string;
    readAt: Date;
  }>;
  totalRecipientsCount: number;
  readRecipientsCount: number;
  scheduledFor?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  markAsRead(userId: string, userName: string): void;
  isReadBy(userId: string): boolean;
  getReadPercentage(): number;
  isExpired(): boolean;
  canEdit(userId: string): boolean;
  getTargetRecipients(): Promise<any[]>;
}

// Static methods interface
interface IAnnouncementModel extends Model<IAnnouncementDocument> {
  findActiveAnnouncements(userId?: string): Promise<IAnnouncementDocument[]>;
  findByCreator(creatorId: string): Promise<IAnnouncementDocument[]>;
  findUnreadAnnouncements(userId: string): Promise<IAnnouncementDocument[]>;
  findExpiredAnnouncements(): Promise<IAnnouncementDocument[]>;
  getAnnouncementStats(): Promise<any>;
}

const AnnouncementSchema: Schema<IAnnouncementDocument> = new Schema({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat'
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true
  },
  createdByEmail: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  targetAudience: {
    type: String,
    enum: ['everyone', 'specific', 'role-based', 'chat-members'],
    required: true
  },
  targetUserIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetRoles: [{
    type: String,
    trim: true
  }],
  attachments: [{
    public_id: { type: String, required: true },
    secure_url: { type: String, required: true },
    format: { type: String, required: true },
    resource_type: { type: String, required: true },
    bytes: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    original_filename: { type: String, required: true },
    created_at: { type: String, required: true }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedUntil: {
    type: Date
  },
  readBy: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalRecipientsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  readRecipientsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  scheduledFor: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
AnnouncementSchema.index({ createdBy: 1, createdAt: -1 });
AnnouncementSchema.index({ isActive: 1, createdAt: -1 });
AnnouncementSchema.index({ priority: 1, createdAt: -1 });
AnnouncementSchema.index({ targetAudience: 1 });
AnnouncementSchema.index({ targetUserIds: 1 });
AnnouncementSchema.index({ targetRoles: 1 });
AnnouncementSchema.index({ chatId: 1, createdAt: -1 });
AnnouncementSchema.index({ scheduledFor: 1 });
AnnouncementSchema.index({ expiresAt: 1 });
AnnouncementSchema.index({ isPinned: 1, pinnedUntil: 1 });

// TTL index for expired announcements
AnnouncementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware
AnnouncementSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update read recipients count
  this.readRecipientsCount = this.readBy.length;
  
  // Check if pinned period has expired
  if (this.isPinned && this.pinnedUntil && new Date() > this.pinnedUntil) {
    this.isPinned = false;
  }
  
  // If scheduled, make sure it's not active yet
  if (this.scheduledFor && new Date() < this.scheduledFor) {
    this.isActive = false;
  }
  
  next();
});

// Post-save middleware to calculate total recipients
AnnouncementSchema.post('save', async function(doc) {
  if (doc.totalRecipientsCount === 0) {
    try {
      const recipients = await doc.getTargetRecipients();
      doc.totalRecipientsCount = recipients.length;
      await doc.updateOne({ totalRecipientsCount: recipients.length });
    } catch (error) {
      console.error('Error calculating total recipients:', error);
    }
  }
});

// Static Methods
AnnouncementSchema.statics.findActiveAnnouncements = function(userId?: string) {
  const query: any = {
    isActive: true,
    $and: [
      {
        $or: [
          { scheduledFor: { $lte: new Date() } },
          { scheduledFor: { $exists: false } }
        ]
      },
      {
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: { $exists: false } }
        ]
      }
    ]
  };
  
  if (userId) {
    query.$and.push({
      $or: [
        { targetAudience: 'everyone' },
        { targetUserIds: userId },
        { targetAudience: 'specific', targetUserIds: userId }
      ]
    });
  }
  
  return this.find(query)
    .sort({ priority: -1, isPinned: -1, createdAt: -1 })
    .populate('createdBy', 'name email');
};

AnnouncementSchema.statics.findByCreator = function(creatorId: string) {
  return this.find({ createdBy: creatorId })
    .sort({ createdAt: -1 })
    .populate('readBy.userId', 'name email');
};

AnnouncementSchema.statics.findUnreadAnnouncements = function(userId: string) {
  return this.find({
    isActive: true,
    $and: [
      {
        $or: [
          { scheduledFor: { $lte: new Date() } },
          { scheduledFor: { $exists: false } }
        ]
      },
      {
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: { $exists: false } }
        ]
      },
      {
        $or: [
          { targetAudience: 'everyone' },
          { targetUserIds: userId }
        ]
      }
    ],
    'readBy.userId': { $ne: userId }
  })
    .sort({ priority: -1, createdAt: -1 });
};

AnnouncementSchema.statics.findExpiredAnnouncements = function() {
  return this.find({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isPinned: true, pinnedUntil: { $lt: new Date() } }
    ],
    isActive: true
  });
};

AnnouncementSchema.statics.getAnnouncementStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalAnnouncements: { $sum: 1 },
        activeAnnouncements: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        pinnedAnnouncements: {
          $sum: { $cond: ['$isPinned', 1, 0] }
        },
        urgentAnnouncements: {
          $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
        },
        averageReadPercentage: {
          $avg: {
            $cond: [
              { $eq: ['$totalRecipientsCount', 0] },
              0,
              { $multiply: [{ $divide: ['$readRecipientsCount', '$totalRecipientsCount'] }, 100] }
            ]
          }
        }
      }
    }
  ]);

  return stats[0] || {
    totalAnnouncements: 0,
    activeAnnouncements: 0,
    pinnedAnnouncements: 0,
    urgentAnnouncements: 0,
    averageReadPercentage: 0
  };
};

// Instance Methods
AnnouncementSchema.methods.markAsRead = function(userId: string, userName: string): void {
  const alreadyRead = this.readBy.some((r: { userId: { toString: () => string; }; }) => r.userId.toString() === userId);
  if (!alreadyRead) {
    this.readBy.push({
      userId: new mongoose.Types.ObjectId(userId),
      userName,
      readAt: new Date()
    });
    this.readRecipientsCount = this.readBy.length;
  }
};

AnnouncementSchema.methods.isReadBy = function(userId: string): boolean {
  return this.readBy.some((r: { userId: { toString: () => string; }; }) => r.userId.toString() === userId);
};

AnnouncementSchema.methods.getReadPercentage = function(): number {
  if (this.totalRecipientsCount === 0) return 0;
  return Math.round((this.readRecipientsCount / this.totalRecipientsCount) * 100);
};

AnnouncementSchema.methods.isExpired = function(): boolean {
  return this.expiresAt ? new Date() > this.expiresAt : false;
};

AnnouncementSchema.methods.canEdit = function(userId: string): boolean {
  return this.createdBy.toString() === userId;
};

AnnouncementSchema.methods.getTargetRecipients = async function(): Promise<any[]> {
  const User = mongoose.model('User');
  let recipients: any[] = [];

  switch (this.targetAudience) {
    case 'everyone':
      recipients = await User.find({ role: 'employee' }, '_id name email');
      break;
      
    case 'specific':
      if (this.targetUserIds && this.targetUserIds.length > 0) {
        recipients = await User.find(
          { _id: { $in: this.targetUserIds } },
          '_id name email'
        );
      }
      break;
      
    case 'role-based':
      if (this.targetRoles && this.targetRoles.length > 0) {
        // This would need to be adapted based on your user role structure
        recipients = await User.find(
          { role: { $in: this.targetRoles } },
          '_id name email'
        );
      }
      break;
      
    case 'chat-members':
      if (this.chatId) {
        const Chat = mongoose.model('Chat');
        const chat = await Chat.findById(this.chatId);
        if (chat) {
          const userIds = chat.participants
            .filter((p: any) => p.isActive)
            .map((p: any) => p.userId);
          recipients = await User.find(
            { _id: { $in: userIds } },
            '_id name email'
          );
        }
      }
      break;
  }

  return recipients;
};

const Announcement: IAnnouncementModel = 
  (mongoose.models.Announcement as IAnnouncementModel) || 
  mongoose.model<IAnnouncementDocument, IAnnouncementModel>('Announcement', AnnouncementSchema);

export default Announcement;