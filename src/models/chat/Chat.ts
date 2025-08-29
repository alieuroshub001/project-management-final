// models/chat/Chat.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

// Chat Document Interface
export interface IChatDocument extends Document {
  name?: string;
  description?: string;
  chatType: string;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  createdByEmail: string;
  participants: Array<{
    id: string;
    userId: mongoose.Types.ObjectId;
    userName: string;
    userEmail: string;
    userMobile: string;
    displayName?: string;
    profileImage?: {
      public_id: string;
      secure_url: string;
      format: string;
      resource_type: string;
      bytes: number;
      width?: number;
      height?: number;
      original_filename: string;
      created_at: string;
    };
    role: string;
    permissions: string[];
    joinedAt: Date;
    leftAt?: Date;
    isActive: boolean;
    isMuted: boolean;
    mutedUntil?: Date;
    lastSeenAt?: Date;
    isOnline: boolean;
    lastReadMessageId?: string;
    unreadCount: number;
  }>;
  lastMessageId?: mongoose.Types.ObjectId;
  lastActivity: Date;
  isArchived: boolean;
  isPinned: boolean;
  pinnedBy?: string;
  pinnedAt?: Date;
  settings: {
    allowFileSharing: boolean;
    allowReactions: boolean;
    allowMentions: boolean;
    allowForwarding: boolean;
    allowPinning: boolean;
    allowThreads: boolean;
    allowEditing: boolean;
    allowDeleting: boolean;
    messageRetentionDays?: number;
    maxFileSize: number;
    allowedFileTypes: string[];
    muteNotifications: boolean;
    mutedUntil?: Date;
    customNotificationSound?: string;
    theme?: string;
    language?: string;
    timezone?: string;
  };
  totalMessages: number;
  unreadCount: number;
  avatar?: {
    public_id: string;
    secure_url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
    original_filename: string;
    created_at: string;
  };
  coverImage?: {
    public_id: string;
    secure_url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
    original_filename: string;
    created_at: string;
  };
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  addParticipant(userData: any): void;
  removeParticipant(userId: string): void;
  updateParticipant(userId: string, updateData: any): void;
  getParticipant(userId: string): any;
  isParticipant(userId: string): boolean;
  canUserPerformAction(userId: string, action: string): boolean;
  updateLastActivity(): void;
  incrementUnreadCount(): void;
  markAsRead(userId: string, messageId: string): void;
}

// Static methods interface
interface IChatModel extends Model<IChatDocument> {
  findByParticipant(userId: string, chatType?: string): Promise<IChatDocument[]>;
  findDirectChat(user1Id: string, user2Id: string): Promise<IChatDocument | null>;
  findUserChats(userId: string, filters?: any): Promise<IChatDocument[]>;
  searchChats(query: string, userId: string): Promise<IChatDocument[]>;
  getUnreadCount(userId: string): Promise<number>;
  findPinnedChats(userId: string): Promise<IChatDocument[]>;
  findArchivedChats(userId: string): Promise<IChatDocument[]>;
}

const ChatSchema: Schema<IChatDocument> = new Schema({
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  chatType: {
    type: String,
    enum: ['direct', 'group', 'channel', 'announcement'],
    required: true
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
  participants: [{
    id: { type: String, required: true },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userMobile: { type: String, required: true },
    displayName: { type: String },
    profileImage: {
      public_id: { type: String },
      secure_url: { type: String },
      format: { type: String },
      resource_type: { type: String },
      bytes: { type: Number },
      width: { type: Number },
      height: { type: Number },
      original_filename: { type: String },
      created_at: { type: String }
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'moderator', 'owner', 'guest'],
      default: 'member'
    },
    permissions: [{
      type: String,
      enum: [
        'send-messages', 'send-attachments', 'delete-own-messages',
        'delete-any-messages', 'edit-own-messages', 'edit-any-messages',
        'pin-messages', 'react-to-messages', 'mention-users',
        'add-participants', 'remove-participants', 'edit-chat-info',
        'manage-permissions', 'create-announcements'
      ]
    }],
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
    isActive: { type: Boolean, default: true },
    isMuted: { type: Boolean, default: false },
    mutedUntil: { type: Date },
    lastSeenAt: { type: Date },
    isOnline: { type: Boolean, default: false },
    lastReadMessageId: { type: String },
    unreadCount: { type: Number, default: 0 }
  }],
  lastMessageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedBy: {
    type: String
  },
  pinnedAt: {
    type: Date
  },
  settings: {
    allowFileSharing: { type: Boolean, default: true },
    allowReactions: { type: Boolean, default: true },
    allowMentions: { type: Boolean, default: true },
    allowForwarding: { type: Boolean, default: true },
    allowPinning: { type: Boolean, default: true },
    allowThreads: { type: Boolean, default: true },
    allowEditing: { type: Boolean, default: true },
    allowDeleting: { type: Boolean, default: true },
    messageRetentionDays: { type: Number },
    maxFileSize: { type: Number, default: 50 }, // MB
    allowedFileTypes: [{
      type: String,
      default: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt']
    }],
    muteNotifications: { type: Boolean, default: false },
    mutedUntil: { type: Date },
    customNotificationSound: { type: String },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto', 'custom'],
      default: 'auto'
    },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' }
  },
  totalMessages: {
    type: Number,
    default: 0,
    min: 0
  },
  unreadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  avatar: {
    public_id: { type: String },
    secure_url: { type: String },
    format: { type: String },
    resource_type: { type: String },
    bytes: { type: Number },
    width: { type: Number },
    height: { type: Number },
    original_filename: { type: String },
    created_at: { type: String }
  },
  coverImage: {
    public_id: { type: String },
    secure_url: { type: String },
    format: { type: String },
    resource_type: { type: String },
    bytes: { type: Number },
    width: { type: Number },
    height: { type: Number },
    original_filename: { type: String },
    created_at: { type: String }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
ChatSchema.index({ 'participants.userId': 1, lastActivity: -1 });
ChatSchema.index({ chatType: 1, lastActivity: -1 });
ChatSchema.index({ createdBy: 1, createdAt: -1 });
ChatSchema.index({ lastActivity: -1 });
ChatSchema.index({ isPinned: 1, lastActivity: -1 });
ChatSchema.index({ isArchived: 1, lastActivity: -1 });
ChatSchema.index({ name: 'text', description: 'text' });

// Compound index for direct chat lookup
ChatSchema.index({ 
  chatType: 1, 
  'participants.userId': 1 
}, { 
  partialFilterExpression: { chatType: 'direct' }
});

// Pre-save middleware
ChatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastActivity = new Date();
  
  // Set default permissions based on role
  this.participants.forEach(participant => {
    if (!participant.permissions || participant.permissions.length === 0) {
      switch (participant.role) {
        case 'owner':
        case 'admin':
          participant.permissions = [
            'send-messages', 'send-attachments', 'delete-own-messages',
            'delete-any-messages', 'edit-own-messages', 'edit-any-messages',
            'pin-messages', 'react-to-messages', 'mention-users',
            'add-participants', 'remove-participants', 'edit-chat-info',
            'manage-permissions', 'create-announcements'
          ];
          break;
        case 'moderator':
          participant.permissions = [
            'send-messages', 'send-attachments', 'delete-own-messages',
            'edit-own-messages', 'pin-messages', 'react-to-messages',
            'mention-users', 'add-participants'
          ];
          break;
        default:
          participant.permissions = [
            'send-messages', 'send-attachments', 'delete-own-messages',
            'edit-own-messages', 'react-to-messages', 'mention-users'
          ];
      }
    }
    
    // Generate participant ID if not exists
    if (!participant.id) {
      participant.id = new mongoose.Types.ObjectId().toString();
    }
  });
  
  // For direct chats, ensure name is set
  if (this.chatType === 'direct' && this.participants.length === 2 && !this.name) {
    const otherParticipant = this.participants.find(p => p.userId.toString() !== this.createdBy.toString());
    if (otherParticipant) {
      this.name = otherParticipant.displayName || otherParticipant.userName;
    }
  }
  
  next();
});

// Virtual for participant count
ChatSchema.virtual('participantCount').get(function() {
  return this.participants.filter(p => p.isActive).length;
});

// Static Methods
ChatSchema.statics.findByParticipant = function(userId: string, chatType?: string) {
  const query: any = {
    'participants.userId': userId,
    'participants.isActive': true,
    isArchived: false
  };
  
  if (chatType) {
    query.chatType = chatType;
  }
  
  return this.find(query)
    .populate('lastMessageId')
    .sort({ lastActivity: -1 });
};

ChatSchema.statics.findDirectChat = function(user1Id: string, user2Id: string) {
  return this.findOne({
    chatType: 'direct',
    'participants.userId': { $all: [user1Id, user2Id] },
    'participants.isActive': true
  });
};

ChatSchema.statics.findUserChats = function(userId: string, filters: any = {}) {
  const query: any = {
    'participants.userId': userId,
    'participants.isActive': true
  };
  
  if (filters.chatType) query.chatType = filters.chatType;
  if (filters.hasUnread !== undefined) {
    if (filters.hasUnread) {
      query['participants.unreadCount'] = { $gt: 0 };
    } else {
      query['participants.unreadCount'] = 0;
    }
  }
  if (filters.isPinned !== undefined) query.isPinned = filters.isPinned;
  if (filters.isArchived !== undefined) query.isArchived = filters.isArchived;
  
  return this.find(query)
    .populate('lastMessageId')
    .sort({ isPinned: -1, lastActivity: -1 })
    .limit(filters.limit || 50);
};

ChatSchema.statics.searchChats = function(query: string, userId: string) {
  return this.find({
    $and: [
      { 'participants.userId': userId },
      { 'participants.isActive': true },
      { 
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  }).sort({ lastActivity: -1 });
};

ChatSchema.statics.getUnreadCount = async function(userId: string) {
  const result = await this.aggregate([
    {
      $match: {
        'participants.userId': new mongoose.Types.ObjectId(userId),
        'participants.isActive': true,
        isArchived: false
      }
    },
    {
      $unwind: '$participants'
    },
    {
      $match: {
        'participants.userId': new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: null,
        totalUnread: { $sum: '$participants.unreadCount' }
      }
    }
  ]);
  
  return result.length > 0 ? result[0].totalUnread : 0;
};

ChatSchema.statics.findPinnedChats = function(userId: string) {
  return this.find({
    'participants.userId': userId,
    'participants.isActive': true,
    isPinned: true,
    isArchived: false
  }).sort({ pinnedAt: -1 });
};

ChatSchema.statics.findArchivedChats = function(userId: string) {
  return this.find({
    'participants.userId': userId,
    'participants.isActive': true,
    isArchived: true
  }).sort({ lastActivity: -1 });
};

// Instance Methods
ChatSchema.methods.addParticipant = function(userData: any): void {
  const participantId = new mongoose.Types.ObjectId().toString();
  this.participants.push({
    id: participantId,
    userId: userData.userId,
    userName: userData.userName,
    userEmail: userData.userEmail,
    userMobile: userData.userMobile,
    displayName: userData.displayName,
    profileImage: userData.profileImage,
    role: userData.role || 'member',
    permissions: userData.permissions || [],
    joinedAt: new Date(),
    isActive: true,
    isMuted: false,
    isOnline: false,
    unreadCount: 0
  });
  this.lastActivity = new Date();
};

ChatSchema.methods.removeParticipant = function(userId: string): void {
  const participant = this.participants.find((p: { userId: { toString: () => string; }; }) => p.userId.toString() === userId);
  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
    this.lastActivity = new Date();
  }
};

ChatSchema.methods.updateParticipant = function(userId: string, updateData: any): void {
  const participant = this.participants.find((p: { userId: { toString: () => string; }; }) => p.userId.toString() === userId);
  if (participant) {
    Object.assign(participant, updateData);
    this.lastActivity = new Date();
  }
};

ChatSchema.methods.getParticipant = function(userId: string): any {
  return this.participants.find((p: { userId: { toString: () => string; }; isActive: any; }) => p.userId.toString() === userId && p.isActive);
};

ChatSchema.methods.isParticipant = function(userId: string): boolean {
  return this.participants.some((p: { userId: { toString: () => string; }; isActive: any; }) => p.userId.toString() === userId && p.isActive);
};

ChatSchema.methods.canUserPerformAction = function(userId: string, action: string): boolean {
  const participant = this.getParticipant(userId);
  if (!participant) return false;
  
  // Owners and creators can do everything
  if (participant.role === 'owner' || this.createdBy.toString() === userId) {
    return true;
  }
  
  return participant.permissions.includes(action);
};

ChatSchema.methods.updateLastActivity = function(): void {
  this.lastActivity = new Date();
};

ChatSchema.methods.incrementUnreadCount = function(): void {
  this.participants.forEach((participant: { isActive: any; unreadCount: number; }) => {
    if (participant.isActive) {
      participant.unreadCount += 1;
    }
  });
  this.totalMessages += 1;
};

ChatSchema.methods.markAsRead = function(userId: string, messageId: string): void {
  const participant = this.participants.find((p: { userId: { toString: () => string; }; }) => p.userId.toString() === userId);
  if (participant) {
    participant.unreadCount = 0;
    participant.lastReadMessageId = messageId;
    participant.lastSeenAt = new Date();
  }
};

const Chat: IChatModel = 
  (mongoose.models.Chat as IChatModel) || 
  mongoose.model<IChatDocument, IChatModel>('Chat', ChatSchema);

export default Chat;