// models/Chat.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

// Chat Document Interface
export interface IChatDocument extends Document {
  name: string;
  type: string;
  description?: string;
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
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  createdByEmail: string;
  participants: mongoose.Types.ObjectId[];
  admins: mongoose.Types.ObjectId[];
  lastMessageId?: mongoose.Types.ObjectId;
  lastActivity: Date;
  isArchived: boolean;
  isPinned: boolean;
  settings: {
    allowFileUploads: boolean;
    allowPolls: boolean;
    allowAnnouncements: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    messageRetention: number;
    requireApprovalForNewMembers: boolean;
    allowMembersToAddOthers: boolean;
    allowMembersToCreatePolls: boolean;
    muteNotifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isParticipant(userId: string): boolean;
  isAdmin(userId: string): boolean;
  addParticipant(userId: string, role?: string): Promise<void>;
  removeParticipant(userId: string): Promise<void>;
  updateLastActivity(): Promise<void>;
}

interface IChatModel extends Model<IChatDocument> {
  findByParticipant(userId: string): Promise<IChatDocument[]>;
  findDirectChat(user1Id: string, user2Id: string): Promise<IChatDocument | null>;
}

const ChatSchema: Schema<IChatDocument> = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  type: {
    type: String,
    enum: ['direct', 'group', 'channel', 'announcement'],
    required: true
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
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
    type: Schema.Types.ObjectId,
    ref: 'ChatParticipant'
  }],
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
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
  settings: {
    allowFileUploads: { type: Boolean, default: true },
    allowPolls: { type: Boolean, default: true },
    allowAnnouncements: { type: Boolean, default: true },
    maxFileSize: { type: Number, default: 50 }, // MB
    allowedFileTypes: [{
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'spreadsheet', 'presentation', 'archive', 'other']
    }],
    messageRetention: { type: Number, default: 0 }, // 0 = unlimited
    requireApprovalForNewMembers: { type: Boolean, default: false },
    allowMembersToAddOthers: { type: Boolean, default: true },
    allowMembersToCreatePolls: { type: Boolean, default: true },
    muteNotifications: { type: Boolean, default: false }
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
ChatSchema.index({ participants: 1 });
ChatSchema.index({ type: 1 });
ChatSchema.index({ createdBy: 1 });
ChatSchema.index({ lastActivity: -1 });
ChatSchema.index({ isArchived: 1, isPinned: 1 });

// Pre-save middleware
ChatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
ChatSchema.methods.isParticipant = function(userId: string): boolean {
  return this.participants.some((p: any) => p.toString() === userId);
};

ChatSchema.methods.isAdmin = function(userId: string): boolean {
  return this.admins.some((a: any) => a.toString() === userId) || this.createdBy.toString() === userId;
};

ChatSchema.methods.addParticipant = async function(userId: string, role: string = 'member'): Promise<void> {
  if (!this.isParticipant(userId)) {
    const ChatParticipant = mongoose.model('ChatParticipant');
    const participant = await ChatParticipant.create({
      chatId: this._id,
      userId,
      role,
      joinedAt: new Date(),
      isActive: true,
      isMuted: false,
      permissions: this.getDefaultPermissions(role)
    });
    this.participants.push(participant._id);
    await this.save();
  }
};

ChatSchema.methods.removeParticipant = async function(userId: string): Promise<void> {
  const ChatParticipant = mongoose.model('ChatParticipant');
  await ChatParticipant.findOneAndUpdate(
    { chatId: this._id, userId },
    { isActive: false, leftAt: new Date() }
  );
};

ChatSchema.methods.updateLastActivity = async function(): Promise<void> {
  this.lastActivity = new Date();
  await this.save();
};

// Static methods
ChatSchema.statics.findByParticipant = function(userId: string) {
  return this.find({ participants: userId, isArchived: false }).sort({ lastActivity: -1 });
};

ChatSchema.statics.findDirectChat = function(user1Id: string, user2Id: string) {
  return this.findOne({
    type: 'direct',
    participants: { $all: [user1Id, user2Id] }
  });
};

const Chat: IChatModel = 
  (mongoose.models.Chat as IChatModel) || 
  mongoose.model<IChatDocument, IChatModel>('Chat', ChatSchema);

// ChatParticipant Model
export interface IChatParticipantDocument extends Document {
  chatId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  userAvatar?: {
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
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  isMuted: boolean;
  lastReadMessageId?: mongoose.Types.ObjectId;
  lastReadAt?: Date;
  permissions: string[];

  // Instance methods
  hasPermission(permission: string): boolean;
  updateLastRead(messageId: string): Promise<void>;
}

interface IChatParticipantModel extends Model<IChatParticipantDocument> {
  findByChatId(chatId: string): Promise<IChatParticipantDocument[]>;
  findByUserId(userId: string): Promise<IChatParticipantDocument[]>;
}

const ChatParticipantSchema: Schema<IChatParticipantDocument> = new Schema({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userAvatar: {
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
    enum: ['owner', 'admin', 'moderator', 'member', 'guest'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isMuted: {
    type: Boolean,
    default: false
  },
  lastReadMessageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastReadAt: {
    type: Date
  },
  permissions: [{
    type: String,
    enum: [
      'send-messages', 'send-files', 'create-polls', 'pin-messages',
      'delete-messages', 'edit-messages', 'mention-all', 'add-members',
      'remove-members', 'manage-chat', 'create-announcements'
    ]
  }]
});

// Indexes
ChatParticipantSchema.index({ chatId: 1, userId: 1 }, { unique: true });
ChatParticipantSchema.index({ userId: 1, isActive: 1 });

// Instance methods
ChatParticipantSchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes(permission);
};

ChatParticipantSchema.methods.updateLastRead = async function(messageId: string): Promise<void> {
  this.lastReadMessageId = messageId;
  this.lastReadAt = new Date();
  await this.save();
};

// Static methods
ChatParticipantSchema.statics.findByChatId = function(chatId: string) {
  return this.find({ chatId, isActive: true }).populate('userId', 'name email mobile');
};

ChatParticipantSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId, isActive: true }).populate('chatId');
};

const ChatParticipant: IChatParticipantModel = 
  (mongoose.models.ChatParticipant as IChatParticipantModel) || 
  mongoose.model<IChatParticipantDocument, IChatParticipantModel>('ChatParticipant', ChatParticipantSchema);

// Message Model
export interface IMessageDocument extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderEmail: string;
  senderAvatar?: {
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
  replyToMessageId?: mongoose.Types.ObjectId;
  mentions: string[];
  attachments: mongoose.Types.ObjectId[];
  reactions: Array<{
    id: string;
    userId: string;
    userName: string;
    emoji: string;
    createdAt: Date;
  }>;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deliveredTo: Array<{
    userId: string;
    deliveredAt: Date;
  }>;
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  isPinned: boolean;
  pinnedBy?: mongoose.Types.ObjectId;
  pinnedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  addReaction(userId: string, userName: string, emoji: string): void;
  removeReaction(userId: string, emoji: string): void;
  markAsRead(userId: string): void;
  markAsDelivered(userId: string): void;
}

interface IMessageModel extends Model<IMessageDocument> {
  deliveredTo: any;
  _id: any;
  chatId: any;
  senderId: any;
  senderName: any;
  content: any;
  messageType: any;
  attachments: any;
  reactions: any;
  isEdited: any;
  editedAt: any;
  createdAt: any;
  readBy: any;
  findByChatId(chatId: string, limit?: number): Promise<IMessageDocument[]>;
  findUnreadMessages(userId: string, chatId: string): Promise<IMessageDocument[]>;
  searchMessages(query: string, chatIds?: string[]): Promise<IMessageDocument[]>;
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
  senderAvatar: {
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
    enum: ['text', 'file', 'image', 'video', 'audio', 'poll', 'announcement', 'system', 'reply'],
    default: 'text'
  },
  replyToMessageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  mentions: [{
    type: String
  }],
  attachments: [{
    type: Schema.Types.ObjectId,
    ref: 'MessageAttachment'
  }],
  reactions: [{
    id: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deliveredTo: [{
    userId: { type: String, required: true },
    deliveredAt: { type: Date, required: true }
  }],
  readBy: [{
    userId: { type: String, required: true },
    readAt: { type: Date, required: true }
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  pinnedAt: {
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

// Indexes
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ replyToMessageId: 1 });
MessageSchema.index({ isPinned: 1 });
MessageSchema.index({ content: 'text' });

// Pre-save middleware
MessageSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  this.updatedAt = new Date();
  next();
});

// Instance methods
MessageSchema.methods.addReaction = function(userId: string, userName: string, emoji: string): void {
  const existingReaction = this.reactions.find((r: any) => r.userId === userId && r.emoji === emoji);
  if (!existingReaction) {
    this.reactions.push({
      id: new mongoose.Types.ObjectId().toString(),
      userId,
      userName,
      emoji,
      createdAt: new Date()
    });
  }
};

MessageSchema.methods.removeReaction = function(userId: string, emoji: string): void {
  this.reactions = this.reactions.filter((r: any) => !(r.userId === userId && r.emoji === emoji));
};

MessageSchema.methods.markAsRead = function(userId: string): void {
  const existingRead = this.readBy.find((r: any) => r.userId === userId);
  if (!existingRead) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
  }
};

MessageSchema.methods.markAsDelivered = function(userId: string): void {
  const existingDelivery = this.deliveredTo.find((d: any) => d.userId === userId);
  if (!existingDelivery) {
    this.deliveredTo.push({
      userId,
      deliveredAt: new Date()
    });
  }
};

// Static methods
MessageSchema.statics.findByChatId = function(chatId: string, limit: number = 50) {
  return this.find({ chatId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('replyToMessageId');
};

MessageSchema.statics.findUnreadMessages = function(userId: string, chatId: string) {
  return this.find({
    chatId,
    senderId: { $ne: userId },
    'readBy.userId': { $ne: userId },
    isDeleted: false
  });
};

MessageSchema.statics.searchMessages = function(query: string, chatIds?: string[]) {
  const searchQuery: any = {
    $text: { $search: query },
    isDeleted: false
  };
  
  if (chatIds && chatIds.length > 0) {
    searchQuery.chatId = { $in: chatIds };
  }
  
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

const Message: IMessageModel = 
  (mongoose.models.Message as IMessageModel) || 
  mongoose.model<IMessageDocument, IMessageModel>('Message', MessageSchema);

// MessageAttachment Model
export interface IMessageAttachmentDocument extends Document {
  messageId: mongoose.Types.ObjectId;
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
  fileType: string;
  fileName: string;
  fileSize: number;
  description?: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

interface IMessageAttachmentModel extends Model<IMessageAttachmentDocument> {
  findByMessageId(messageId: string): Promise<IMessageAttachmentDocument[]>;
}

const MessageAttachmentSchema: Schema<IMessageAttachmentDocument> = new Schema({
  messageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
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
  fileType: {
    type: String,
    enum: ['image', 'video', 'audio', 'document', 'spreadsheet', 'presentation', 'archive', 'other'],
    required: true
  },
  fileName: {
    type: String,
    required: true,
    maxlength: 255
  },
  fileSize: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
MessageAttachmentSchema.index({ messageId: 1 });

// Static methods
MessageAttachmentSchema.statics.findByMessageId = function(messageId: string) {
  return this.find({ messageId });
};

const MessageAttachment: IMessageAttachmentModel = 
  (mongoose.models.MessageAttachment as IMessageAttachmentModel) || 
  mongoose.model<IMessageAttachmentDocument, IMessageAttachmentModel>('MessageAttachment', MessageAttachmentSchema);

// Poll Model
export interface IPollDocument extends Document {
  messageId: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    voteCount: number;
  }>;
  allowMultipleVotes: boolean;
  isAnonymous: boolean;
  expiresAt?: Date;
  isActive: boolean;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  addVote(userId: string, userName: string, optionIds: string[]): Promise<void>;
  removeVote(userId: string): Promise<void>;
  isExpired(): boolean;
  getResults(): any;
}

interface IPollModel extends Model<IPollDocument> {
  findByChatId(chatId: string): Promise<IPollDocument[]>;
  findActivePolls(): Promise<IPollDocument[]>;
}

const PollSchema: Schema<IPollDocument> = new Schema({
  messageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
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
  question: {
    type: String,
    required: true,
    maxlength: 500
  },
  options: [{
    id: { type: String, required: true },
    text: { type: String, required: true, maxlength: 200 },
    voteCount: { type: Number, default: 0 }
  }],
  allowMultipleVotes: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalVotes: {
    type: Number,
    default: 0
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
PollSchema.index({ chatId: 1, createdAt: -1 });
PollSchema.index({ messageId: 1 });
PollSchema.index({ expiresAt: 1 });

// Pre-save middleware
PollSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
PollSchema.methods.addVote = async function(userId: string, userName: string, optionIds: string[]): Promise<void> {
  const PollVote = mongoose.model('PollVote');
  
  if (!this.allowMultipleVotes) {
    await PollVote.deleteMany({ pollId: this._id, userId });
  }
  
  for (const optionId of optionIds) {
    await PollVote.create({
      pollId: this._id,
      optionId,
      userId,
      userName,
      votedAt: new Date()
    });
    
    const option = this.options.find((opt: any) => opt.id === optionId);
    if (option) {
      option.voteCount += 1;
    }
  }
  
  this.totalVotes = await PollVote.countDocuments({ pollId: this._id });
  await this.save();
};

PollSchema.methods.removeVote = async function(userId: string): Promise<void> {
  const PollVote = mongoose.model('PollVote');
  const votes = await PollVote.find({ pollId: this._id, userId });
  
  for (const vote of votes) {
    const option = this.options.find((opt: any) => opt.id === vote.optionId);
    if (option && option.voteCount > 0) {
      option.voteCount -= 1;
    }
  }
  
  await PollVote.deleteMany({ pollId: this._id, userId });
  this.totalVotes = await PollVote.countDocuments({ pollId: this._id });
  await this.save();
};

PollSchema.methods.isExpired = function(): boolean {
  return this.expiresAt ? new Date() > this.expiresAt : false;
};

PollSchema.methods.getResults = async function(): Promise<any> {
  const PollVote = mongoose.model('PollVote');
  const votes = await PollVote.find({ pollId: this._id });
  
  return {
    question: this.question,
    options: this.options,
    totalVotes: this.totalVotes,
    votes: this.isAnonymous ? [] : votes,
    isExpired: this.isExpired()
  };
};

// Static methods
PollSchema.statics.findByChatId = function(chatId: string) {
  return this.find({ chatId }).sort({ createdAt: -1 });
};

PollSchema.statics.findActivePolls = function() {
  return this.find({ 
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

const Poll: IPollModel = 
  (mongoose.models.Poll as IPollModel) || 
  mongoose.model<IPollDocument, IPollModel>('Poll', PollSchema);

// PollVote Model
export interface IPollVoteDocument extends Document {
  pollId: mongoose.Types.ObjectId;
  optionId: string;
  userId: string;
  userName: string;
  votedAt: Date;
}

const PollVoteSchema: Schema<IPollVoteDocument> = new Schema({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  optionId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
PollVoteSchema.index({ pollId: 1, userId: 1 });
PollVoteSchema.index({ pollId: 1, optionId: 1 });

const PollVote = mongoose.models.PollVote || mongoose.model('PollVote', PollVoteSchema);

// Announcement Model
export interface IAnnouncementDocument extends Document {
  messageId: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  title: string;
  content: string;
  priority: string;
  targetAudience: string[];
  attachments: mongoose.Types.ObjectId[];
  acknowledgments: Array<{
    id: string;
    userId: string;
    userName: string;
    acknowledgedAt: Date;
  }>;
  expiresAt?: Date;
  isActive: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  addAcknowledgment(userId: string, userName: string): void;
  getAcknowledgmentRate(): number;
}

const AnnouncementSchema: Schema<IAnnouncementDocument> = new Schema({
  messageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
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
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  targetAudience: [{
    type: String
  }],
  attachments: [{
    type: Schema.Types.ObjectId,
    ref: 'MessageAttachment'
  }],
  acknowledgments: [{
    id: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    acknowledgedAt: { type: Date, default: Date.now }
  }],
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
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
AnnouncementSchema.index({ chatId: 1, createdAt: -1 });
AnnouncementSchema.index({ priority: 1 });
AnnouncementSchema.index({ expiresAt: 1 });

// Instance methods
AnnouncementSchema.methods.addAcknowledgment = function(userId: string, userName: string): void {
  const existingAck = this.acknowledgments.find((ack: any) => ack.userId === userId);
  if (!existingAck) {
    this.acknowledgments.push({
      id: new mongoose.Types.ObjectId().toString(),
      userId,
      userName,
      acknowledgedAt: new Date()
    });
  }
};

AnnouncementSchema.methods.getAcknowledgmentRate = function(): number {
  const totalAudience = this.targetAudience.length || 1;
  return (this.acknowledgments.length / totalAudience) * 100;
};

const Announcement = mongoose.models.Announcement || 
  mongoose.model('Announcement', AnnouncementSchema);

// ChatActivity Model
export interface IChatActivityDocument extends Document {
  chatId: mongoose.Types.ObjectId;
  activityType: string;
  performedBy: mongoose.Types.ObjectId;
  performedByName: string;
  targetUserId?: string;
  targetUserName?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
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
      'chat-created', 'chat-updated', 'member-added', 'member-removed',
      'member-promoted', 'member-demoted', 'member-muted', 'member-unmuted',
      'message-pinned', 'message-unpinned', 'message-deleted', 'poll-created',
      'poll-closed', 'announcement-created', 'chat-archived', 'chat-unarchived'
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
    type: String
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
ChatActivitySchema.index({ chatId: 1, createdAt: -1 });
ChatActivitySchema.index({ performedBy: 1 });

const ChatActivity = mongoose.models.ChatActivity || 
  mongoose.model('ChatActivity', ChatActivitySchema);

// Export all models
export { 
  Chat, 
  ChatParticipant, 
  Message, 
  MessageAttachment, 
  Poll, 
  PollVote, 
  Announcement, 
  ChatActivity 
};