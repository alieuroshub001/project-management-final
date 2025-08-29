// models/chat/Message.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

// Message Document Interface
export interface IMessageDocument extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderEmail: string;
  senderProfileImage?: {
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
  content: string;
  messageType: string;
  attachments?: Array<{
    id: string;
    file: {
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
    fileName: string;
    fileSize: number;
    mimeType: string;
    thumbnailUrl?: string;
    previewUrl?: string;
    downloadCount: number;
    uploadedBy: string;
    uploadedByName: string;
    createdAt: Date;
  }>;
  replyTo?: {
    messageId: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    attachmentCount: number;
  };
  forwardedFrom?: {
    originalMessageId: string;
    originalChatId: string;
    originalChatName?: string;
    originalSenderId: string;
    originalSenderName: string;
    forwardedBy: string;
    forwardedByName: string;
    forwardedAt: Date;
    forwardChain: number;
  };
  reactions: Array<{
    id: string;
    userId: mongoose.Types.ObjectId;
    userName: string;
    emoji: string;
    createdAt: Date;
  }>;
  mentions: Array<{
    id: string;
    mentionedUserId: mongoose.Types.ObjectId;
    mentionedUserName: string;
    mentionedUserEmail: string;
    mentionType: string;
    startIndex: number;
    endIndex: number;
    isRead: boolean;
    readAt?: Date;
  }>;
  isPinned: boolean;
  pinnedBy?: string;
  pinnedAt?: Date;
  pinnedReason?: string;
  isEdited: boolean;
  editedAt?: Date;
  editHistory?: Array<{
    id: string;
    previousContent: string;
    newContent: string;
    editedBy: string;
    editedByName: string;
    editReason?: string;
    editedAt: Date;
  }>;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  deletedFor: string;
  deliveryStatus: string;
  readBy: Array<{
    userId: mongoose.Types.ObjectId;
    userName: string;
    readAt: Date;
  }>;
  threadId?: string;
  threadRepliesCount: number;
  lastThreadReply?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  canEdit(userId: string): boolean;
  canDelete(userId: string): boolean;
  addReaction(userId: string, userName: string, emoji: string): void;
  removeReaction(userId: string, emoji: string): void;
  markAsRead(userId: string, userName: string): void;
  isReadBy(userId: string): boolean;
  getReactionCount(emoji: string): number;
  pin(userId: string, reason?: string): void;
  unpin(): void;
  softDelete(userId: string, deleteFor: string): void;
  addToEditHistory(previousContent: string, editedBy: string, editedByName: string, reason?: string): void;
}

// Static methods interface
interface IMessageModel extends Model<IMessageDocument> {
  findByChat(chatId: string, limit?: number, offset?: number): Promise<IMessageDocument[]>;
  findPinnedMessages(chatId: string): Promise<IMessageDocument[]>;
  findUnreadMessages(chatId: string, userId: string): Promise<IMessageDocument[]>;
  searchMessages(query: string, chatId?: string, userId?: string): Promise<IMessageDocument[]>;
  getMessageStats(chatId: string): Promise<any>;
  findThreadReplies(threadId: string): Promise<IMessageDocument[]>;
  markChatAsRead(chatId: string, userId: string): Promise<void>;
}

const MessageSchema: Schema<IMessageDocument> = new Schema({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderEmail: {
    type: String,
    required: true
  },
  senderProfileImage: {
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
  content: {
    type: String,
    required: true,
    maxlength: 4000
  },
  messageType: {
    type: String,
    enum: [
      'text', 'image', 'document', 'audio', 'video', 'link',
      'location', 'contact', 'system', 'announcement', 'poll', 'event'
    ],
    default: 'text'
  },
  attachments: [{
    id: { type: String, required: true },
    file: {
      public_id: { type: String, required: true },
      secure_url: { type: String, required: true },
      format: { type: String, required: true },
      resource_type: { type: String, required: true },
      bytes: { type: Number, required: true },
      width: { type: Number },
      height: { type: Number },
      original_filename: { type: String, required: true },
      created_at: { type: String, required: true }
    },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    thumbnailUrl: { type: String },
    previewUrl: { type: String },
    downloadCount: { type: Number, default: 0 },
    uploadedBy: { type: String, required: true },
    uploadedByName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  replyTo: {
    messageId: { type: String },
    content: { type: String, maxlength: 200 },
    senderId: { type: String },
    senderName: { type: String },
    timestamp: { type: Date },
    attachmentCount: { type: Number, default: 0 }
  },
  forwardedFrom: {
    originalMessageId: { type: String },
    originalChatId: { type: String },
    originalChatName: { type: String },
    originalSenderId: { type: String },
    originalSenderName: { type: String },
    forwardedBy: { type: String },
    forwardedByName: { type: String },
    forwardedAt: { type: Date },
    forwardChain: { type: Number, default: 1, max: 5 }
  },
  reactions: [{
    id: { type: String, required: true },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    userName: { type: String, required: true },
    emoji: { type: String, required: true, maxlength: 10 },
    createdAt: { type: Date, default: Date.now }
  }],
  mentions: [{
    id: { type: String, required: true },
    mentionedUserId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    mentionedUserName: { type: String, required: true },
    mentionedUserEmail: { type: String, required: true },
    mentionType: {
      type: String,
      enum: ['user', 'everyone', 'here'],
      default: 'user'
    },
    startIndex: { type: Number, required: true },
    endIndex: { type: Number, required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date }
  }],
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
  pinnedReason: {
    type: String,
    maxlength: 200
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  editHistory: [{
    id: { type: String, required: true },
    previousContent: { type: String, required: true },
    newContent: { type: String, required: true },
    editedBy: { type: String, required: true },
    editedByName: { type: String, required: true },
    editReason: { type: String, maxlength: 200 },
    editedAt: { type: Date, default: Date.now }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: String
  },
  deletedFor: {
    type: String,
    enum: ['none', 'sender', 'everyone'],
    default: 'none'
  },
  deliveryStatus: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sending'
  },
  readBy: [{
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    userName: { type: String, required: true },
    readAt: { type: Date, default: Date.now }
  }],
  threadId: {
    type: String
  },
  threadRepliesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastThreadReply: {
    type: Date
  },
  metadata: {
    type: Schema.Types.Mixed
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

// Indexes for better performance
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ chatId: 1, isPinned: 1 });
MessageSchema.index({ chatId: 1, isDeleted: 1, createdAt: -1 });
MessageSchema.index({ threadId: 1, createdAt: 1 });
MessageSchema.index({ 'mentions.mentionedUserId': 1, 'mentions.isRead': 1 });
MessageSchema.index({ content: 'text' });
MessageSchema.index({ messageType: 1 });

// TTL index for auto-deletion based on retention policy
MessageSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 0,
  partialFilterExpression: { 
    messageType: 'system',
    'metadata.autoDelete': true
  }
});

// Pre-save middleware
MessageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Generate IDs for nested objects if not present
  if (this.attachments) {
    this.attachments.forEach(attachment => {
      if (!attachment.id) {
        attachment.id = new mongoose.Types.ObjectId().toString();
      }
    });
  }
  
  if (this.reactions) {
    this.reactions.forEach(reaction => {
      if (!reaction.id) {
        reaction.id = new mongoose.Types.ObjectId().toString();
      }
    });
  }
  
  if (this.mentions) {
    this.mentions.forEach(mention => {
      if (!mention.id) {
        mention.id = new mongoose.Types.ObjectId().toString();
      }
    });
  }
  
  if (this.editHistory) {
    this.editHistory.forEach(edit => {
      if (!edit.id) {
        edit.id = new mongoose.Types.ObjectId().toString();
      }
    });
  }
  
  // Auto-generate thread ID for replies
  if (this.replyTo && this.replyTo.messageId && !this.threadId) {
    this.threadId = this.replyTo.messageId;
  }
  
  // Update delivery status based on read receipts
  if (this.readBy && this.readBy.length > 0) {
    this.deliveryStatus = 'read';
  } else if (this.deliveryStatus === 'sending') {
    this.deliveryStatus = 'sent';
  }
  
  next();
});

// Post-save middleware to update chat last message and activity
MessageSchema.post('save', async function(doc: IMessageDocument) {
  try {
    const Chat = mongoose.model('Chat');
    const messageId = (doc._id as mongoose.Types.ObjectId).toString();
    
    await Chat.findByIdAndUpdate(doc.chatId, {
      lastMessageId: doc._id,
      lastActivity: doc.createdAt,
      $inc: { totalMessages: 1 }
    });
    
    // Update thread reply count if this is a thread reply
    if (doc.threadId && doc.threadId !== messageId) {
      await Message.findByIdAndUpdate(doc.threadId, {
        $inc: { threadRepliesCount: 1 },
        lastThreadReply: doc.createdAt
      });
    }
  } catch (error) {
    console.error('Error updating chat after message save:', error);
  }
});

// Virtual for attachment count
MessageSchema.virtual('attachmentCount').get(function() {
  return this.attachments ? this.attachments.length : 0;
});

// Virtual for reaction summary
MessageSchema.virtual('reactionSummary').get(function() {
  if (!this.reactions || this.reactions.length === 0) return {};
  
  const summary: Record<string, number> = {};
  this.reactions.forEach(reaction => {
    summary[reaction.emoji] = (summary[reaction.emoji] || 0) + 1;
  });
  return summary;
});

// Static Methods
MessageSchema.statics.findByChat = function(
  chatId: string, 
  limit: number = 50, 
  offset: number = 0
) {
  return this.find({ 
    chatId, 
    isDeleted: false 
  })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate('senderId', 'name email profileImage');
};

MessageSchema.statics.findPinnedMessages = function(chatId: string) {
  return this.find({ 
    chatId, 
    isPinned: true, 
    isDeleted: false 
  })
    .sort({ pinnedAt: -1 })
    .populate('senderId', 'name email');
};

MessageSchema.statics.findUnreadMessages = function(chatId: string, userId: string) {
  return this.find({
    chatId,
    isDeleted: false,
    senderId: { $ne: userId },
    readBy: { $not: { $elemMatch: { userId } } }
  })
    .sort({ createdAt: 1 });
};

MessageSchema.statics.searchMessages = function(
  query: string, 
  chatId?: string, 
  userId?: string
) {
  const searchQuery: any = {
    $text: { $search: query },
    isDeleted: false
  };
  
  if (chatId) {
    searchQuery.chatId = chatId;
  }
  
  if (userId) {
    // Only search in chats where user is a participant
    searchQuery['chatId'] = {
      $in: [] // This would be populated with user's chat IDs
    };
  }
  
  return this.find(searchQuery)
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .limit(100);
};

MessageSchema.statics.getMessageStats = async function(chatId: string) {
  const stats = await this.aggregate([
    { $match: { chatId: new mongoose.Types.ObjectId(chatId), isDeleted: false } },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        totalAttachments: { $sum: { $size: { $ifNull: ['$attachments', []] } } },
        totalReactions: { $sum: { $size: { $ifNull: ['$reactions', []] } } },
        pinnedMessages: { $sum: { $cond: ['$isPinned', 1, 0] } },
        messagesByType: {
          $push: {
            type: '$messageType',
            count: 1
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalMessages: 0,
    totalAttachments: 0,
    totalReactions: 0,
    pinnedMessages: 0,
    messagesByType: []
  };
};

MessageSchema.statics.findThreadReplies = function(threadId: string) {
  return this.find({ 
    threadId, 
    isDeleted: false,
    _id: { $ne: threadId } // Exclude the original message
  })
    .sort({ createdAt: 1 })
    .populate('senderId', 'name email profileImage');
};

MessageSchema.statics.markChatAsRead = async function(chatId: string, userId: string) {
  const user = await mongoose.model('User').findById(userId, 'name');
  if (!user) return;
  
  await this.updateMany(
    {
      chatId,
      senderId: { $ne: userId },
      readBy: { $not: { $elemMatch: { userId } } },
      isDeleted: false
    },
    {
      $push: {
        readBy: {
          userId,
          userName: user.name,
          readAt: new Date()
        }
      }
    }
  );
  
  // Update chat participant unread count
  const Chat = mongoose.model('Chat');
  await Chat.findOneAndUpdate(
    { 
      _id: chatId,
      'participants.userId': userId
    },
    {
      $set: {
        'participants.$.unreadCount': 0,
        'participants.$.lastSeenAt': new Date()
      }
    }
  );
};

// Instance Methods
MessageSchema.methods.canEdit = function(userId: string): boolean {
  // Only sender can edit their own messages within 24 hours
  const hoursSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
  return this.senderId.toString() === userId && 
         !this.isDeleted && 
         hoursSinceCreation <= 24;
};

MessageSchema.methods.canDelete = function(userId: string): boolean {
  // Sender can always delete their own messages
  // Chat admins can delete any message (would need to check chat permissions)
  return this.senderId.toString() === userId && !this.isDeleted;
};

MessageSchema.methods.addReaction = function(
  userId: string, 
  userName: string, 
  emoji: string
): void {
  // Remove existing reaction from same user for same emoji
  this.reactions = this.reactions.filter((r: { userId: { toString: () => string; }; emoji: string; }) => 
    !(r.userId.toString() === userId && r.emoji === emoji)
  );
  
  // Add new reaction
  this.reactions.push({
    id: new mongoose.Types.ObjectId().toString(),
    userId: new mongoose.Types.ObjectId(userId),
    userName,
    emoji,
    createdAt: new Date()
  });
};

MessageSchema.methods.removeReaction = function(userId: string, emoji: string): void {
  this.reactions = this.reactions.filter((r: { userId: { toString: () => string; }; emoji: string; }) => 
    !(r.userId.toString() === userId && r.emoji === emoji)
  );
};

MessageSchema.methods.markAsRead = function(userId: string, userName: string): void {
  // Check if already read by this user
  const alreadyRead = this.readBy.some((r: { userId: { toString: () => string; }; }) => r.userId.toString() === userId);
  if (!alreadyRead) {
    this.readBy.push({
      userId: new mongoose.Types.ObjectId(userId),
      userName,
      readAt: new Date()
    });
    this.deliveryStatus = 'read';
  }
};

MessageSchema.methods.isReadBy = function(userId: string): boolean {
  return this.readBy.some((r: { userId: { toString: () => string; }; }) => r.userId.toString() === userId);
};

MessageSchema.methods.getReactionCount = function(emoji: string): number {
  return this.reactions.filter((r: { emoji: string; }) => r.emoji === emoji).length;
};

MessageSchema.methods.pin = function(userId: string, reason?: string): void {
  this.isPinned = true;
  this.pinnedBy = userId;
  this.pinnedAt = new Date();
  this.pinnedReason = reason;
};

MessageSchema.methods.unpin = function(): void {
  this.isPinned = false;
  this.pinnedBy = undefined;
  this.pinnedAt = undefined;
  this.pinnedReason = undefined;
};

MessageSchema.methods.softDelete = function(userId: string, deleteFor: string = 'sender'): void {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.deletedFor = deleteFor;
  
  if (deleteFor === 'everyone') {
    this.content = 'This message was deleted';
    this.attachments = [];
  }
};

MessageSchema.methods.addToEditHistory = function(
  previousContent: string,
  editedBy: string,
  editedByName: string,
  reason?: string
): void {
  if (!this.editHistory) {
    this.editHistory = [];
  }
  
  this.editHistory.push({
    id: new mongoose.Types.ObjectId().toString(),
    previousContent,
    newContent: this.content,
    editedBy,
    editedByName,
    editReason: reason,
    editedAt: new Date()
  });
  
  this.isEdited = true;
  this.editedAt = new Date();
};

const Message: IMessageModel = 
  (mongoose.models.Message as IMessageModel) || 
  mongoose.model<IMessageDocument, IMessageModel>('Message', MessageSchema);

export default Message;