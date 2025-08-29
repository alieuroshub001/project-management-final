// models/chat/ChatActivity.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

// Chat Activity Document Interface
export interface IChatActivityDocument extends Document {
  chatId: mongoose.Types.ObjectId;
  activityType: string;
  performedBy: mongoose.Types.ObjectId;
  performedByName: string;
  targetUserId?: mongoose.Types.ObjectId;
  targetUserName?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;

  // Instance methods
  getFormattedDescription(): string;
}

// Static methods interface
interface IChatActivityModel extends Model<IChatActivityDocument> {
  findByChat(chatId: string, limit?: number): Promise<IChatActivityDocument[]>;
  findByUser(userId: string, limit?: number): Promise<IChatActivityDocument[]>;
  createActivity(data: Partial<IChatActivityDocument>): Promise<IChatActivityDocument>;
  getRecentActivities(chatIds: string[], limit?: number): Promise<IChatActivityDocument[]>;
}

const ChatActivitySchema: Schema<IChatActivityDocument> = new Schema({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  activityType: {
    type: String,
    enum: [
      'chat-created', 'participant-added', 'participant-removed', 
      'participant-left', 'participant-promoted', 'participant-demoted',
      'chat-renamed', 'chat-description-changed', 'chat-avatar-changed',
      'chat-settings-changed', 'message-pinned', 'message-unpinned',
      'chat-archived', 'chat-unarchived', 'announcement-created',
      'announcement-updated', 'user-muted', 'user-unmuted'
    ],
    required: true
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByName: {
    type: String,
    required: true
  },
  targetUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  targetUserName: {
    type: String
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes
ChatActivitySchema.index({ chatId: 1, timestamp: -1 });
ChatActivitySchema.index({ performedBy: 1, timestamp: -1 });
ChatActivitySchema.index({ activityType: 1, timestamp: -1 });
ChatActivitySchema.index({ targetUserId: 1, timestamp: -1 });

// TTL index to auto-delete old activities after 90 days
ChatActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Static Methods
ChatActivitySchema.statics.findByChat = function(chatId: string, limit: number = 50) {
  return this.find({ chatId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('performedBy', 'name email profileImage')
    .populate('targetUserId', 'name email');
};

ChatActivitySchema.statics.findByUser = function(userId: string, limit: number = 50) {
  return this.find({ 
    $or: [
      { performedBy: userId },
      { targetUserId: userId }
    ]
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('chatId', 'name chatType')
    .populate('performedBy', 'name email');
};

ChatActivitySchema.statics.createActivity = function(data: Partial<IChatActivityDocument>) {
  return this.create({
    ...data,
    timestamp: new Date()
  });
};

ChatActivitySchema.statics.getRecentActivities = function(
  chatIds: string[], 
  limit: number = 100
) {
  return this.find({ 
    chatId: { $in: chatIds.map(id => new mongoose.Types.ObjectId(id)) }
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('chatId', 'name chatType')
    .populate('performedBy', 'name email profileImage');
};

// Instance Methods
ChatActivitySchema.methods.getFormattedDescription = function(): string {
  // This could be enhanced to provide localized descriptions
  const timeAgo = this.getTimeAgo();
  return `${this.description} • ${timeAgo}`;
};

// Helper method to get human-readable time ago
ChatActivitySchema.methods.getTimeAgo = function(): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - this.timestamp.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return this.timestamp.toLocaleDateString();
};

const ChatActivity: IChatActivityModel = 
  (mongoose.models.ChatActivity as IChatActivityModel) || 
  mongoose.model<IChatActivityDocument, IChatActivityModel>('ChatActivity', ChatActivitySchema);

export default ChatActivity;