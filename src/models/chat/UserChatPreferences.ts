// models/chat/UserChatPreferences.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

// User Chat Preferences Document Interface
export interface IUserChatPreferencesDocument extends Document {
  userId: mongoose.Types.ObjectId;
  enableNotifications: boolean;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableDesktopNotifications: boolean;
  notificationSound: string;
  messagePreview: boolean;
  onlineStatus: string;
  lastSeenPrivacy: string;
  profilePrivacy: string;
  autoDownloadMedia: boolean;
  autoDownloadDocuments: boolean;
  theme: string;
  fontSize: string;
  language: string;
  timezone: string;
  blockedUsers: mongoose.Types.ObjectId[];
  mutedChats: mongoose.Types.ObjectId[];
  pinnedChats: mongoose.Types.ObjectId[];
  archivedChats: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  blockUser(userId: string): void;
  unblockUser(userId: string): void;
  isUserBlocked(userId: string): boolean;
  muteChat(chatId: string): void;
  unmuteChat(chatId: string): void;
  isChatMuted(chatId: string): boolean;
  pinChat(chatId: string): void;
  unpinChat(chatId: string): void;
  isChatPinned(chatId: string): boolean;
  archiveChat(chatId: string): void;
  unarchiveChat(chatId: string): void;
  isChatArchived(chatId: string): boolean;
}

// Static methods interface
interface IUserChatPreferencesModel extends Model<IUserChatPreferencesDocument> {
  getOrCreate(userId: string): Promise<IUserChatPreferencesDocument>;
  findByUserId(userId: string): Promise<IUserChatPreferencesDocument | null>;
  updatePreferences(userId: string, preferences: any): Promise<IUserChatPreferencesDocument | null>;
}

const UserChatPreferencesSchema: Schema<IUserChatPreferencesDocument> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  enableNotifications: {
    type: Boolean,
    default: true
  },
  enablePushNotifications: {
    type: Boolean,
    default: true
  },
  enableEmailNotifications: {
    type: Boolean,
    default: false
  },
  enableDesktopNotifications: {
    type: Boolean,
    default: true
  },
  notificationSound: {
    type: String,
    default: 'default',
    enum: ['default', 'chime', 'bell', 'pop', 'whistle', 'none']
  },
  messagePreview: {
    type: Boolean,
    default: true
  },
  onlineStatus: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy', 'invisible'],
    default: 'online'
  },
  lastSeenPrivacy: {
    type: String,
    enum: ['everyone', 'contacts', 'nobody'],
    default: 'everyone'
  },
  profilePrivacy: {
    type: String,
    enum: ['everyone', 'contacts', 'nobody'],
    default: 'everyone'
  },
  autoDownloadMedia: {
    type: Boolean,
    default: true
  },
  autoDownloadDocuments: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto', 'custom'],
    default: 'auto'
  },
  fontSize: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large'],
    default: 'medium'
  },
  language: {
    type: String,
    default: 'en',
    maxlength: 5
  },
  timezone: {
    type: String,
    default: 'UTC',
    maxlength: 50
  },
  blockedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  mutedChats: [{
    type: Schema.Types.ObjectId,
    ref: 'Chat'
  }],
  pinnedChats: [{
    type: Schema.Types.ObjectId,
    ref: 'Chat'
  }],
  archivedChats: [{
    type: Schema.Types.ObjectId,
    ref: 'Chat'
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

// Indexes
UserChatPreferencesSchema.index({ userId: 1 });
UserChatPreferencesSchema.index({ blockedUsers: 1 });
UserChatPreferencesSchema.index({ mutedChats: 1 });
UserChatPreferencesSchema.index({ pinnedChats: 1 });
UserChatPreferencesSchema.index({ archivedChats: 1 });

// Pre-save middleware
UserChatPreferencesSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Limit pinned chats to maximum of 10
  if (this.pinnedChats.length > 10) {
    this.pinnedChats = this.pinnedChats.slice(0, 10);
  }
  
  next();
});

// Static Methods
UserChatPreferencesSchema.statics.getOrCreate = async function(userId: string) {
  let preferences = await this.findOne({ userId });
  
  if (!preferences) {
    preferences = await this.create({
      userId,
      // Default values are set in the schema
    });
  }
  
  return preferences;
};

UserChatPreferencesSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

UserChatPreferencesSchema.statics.updatePreferences = function(
  userId: string, 
  preferences: any
) {
  return this.findOneAndUpdate(
    { userId },
    { ...preferences, updatedAt: new Date() },
    { new: true, upsert: true }
  );
};

// Instance Methods
UserChatPreferencesSchema.methods.blockUser = function(userId: string): void {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  if (!this.blockedUsers.includes(userObjectId)) {
    this.blockedUsers.push(userObjectId);
  }
};

UserChatPreferencesSchema.methods.unblockUser = function(userId: string): void {
  this.blockedUsers = this.blockedUsers.filter(
      (    id: { toString: () => string; }) => id.toString() !== userId
  );
};

UserChatPreferencesSchema.methods.isUserBlocked = function(userId: string): boolean {
  return this.blockedUsers.some((id: { toString: () => string; }) => id.toString() === userId);
};

UserChatPreferencesSchema.methods.muteChat = function(chatId: string): void {
  const chatObjectId = new mongoose.Types.ObjectId(chatId);
  if (!this.mutedChats.includes(chatObjectId)) {
    this.mutedChats.push(chatObjectId);
  }
};

UserChatPreferencesSchema.methods.unmuteChat = function(chatId: string): void {
  this.mutedChats = this.mutedChats.filter(
      (    id: { toString: () => string; }) => id.toString() !== chatId
  );
};

UserChatPreferencesSchema.methods.isChatMuted = function(chatId: string): boolean {
  return this.mutedChats.some((id: { toString: () => string; }) => id.toString() === chatId);
};

UserChatPreferencesSchema.methods.pinChat = function(chatId: string): void {
  const chatObjectId = new mongoose.Types.ObjectId(chatId);
  if (!this.pinnedChats.includes(chatObjectId) && this.pinnedChats.length < 10) {
    this.pinnedChats.unshift(chatObjectId); // Add to beginning
  }
};

UserChatPreferencesSchema.methods.unpinChat = function(chatId: string): void {
  this.pinnedChats = this.pinnedChats.filter(
      (    id: { toString: () => string; }) => id.toString() !== chatId
  );
};

UserChatPreferencesSchema.methods.isChatPinned = function(chatId: string): boolean {
  return this.pinnedChats.some((id: { toString: () => string; }) => id.toString() === chatId);
};

UserChatPreferencesSchema.methods.archiveChat = function(chatId: string): void {
  const chatObjectId = new mongoose.Types.ObjectId(chatId);
  if (!this.archivedChats.includes(chatObjectId)) {
    this.archivedChats.push(chatObjectId);
  }
  // Remove from pinned if archived
  this.unpinChat(chatId);
};

UserChatPreferencesSchema.methods.unarchiveChat = function(chatId: string): void {
  this.archivedChats = this.archivedChats.filter(
      (    id: { toString: () => string; }) => id.toString() !== chatId
  );
};

UserChatPreferencesSchema.methods.isChatArchived = function(chatId: string): boolean {
  return this.archivedChats.some((id: { toString: () => string; }) => id.toString() === chatId);
};

const UserChatPreferences: IUserChatPreferencesModel = 
  (mongoose.models.UserChatPreferences as IUserChatPreferencesModel) || 
  mongoose.model<IUserChatPreferencesDocument, IUserChatPreferencesModel>('UserChatPreferences', UserChatPreferencesSchema);

export default UserChatPreferences;