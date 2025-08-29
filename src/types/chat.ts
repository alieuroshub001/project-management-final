import { IApiResponse, ISessionUser } from ".";

// Cloudinary File Interfaces
export interface ICloudinaryFile {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  original_filename: string;
  created_at: string;
}

export interface ICloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  original_filename: string;
}

export type FileUploadProgress = {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
};

export interface IFileUploadState {
  files: FileUploadProgress[];
  isUploading: boolean;
  totalProgress: number;
}

export interface IFileUploadResponse {
  success: boolean;
  files: ICloudinaryFile[];
  message?: string;
}

export interface IFileDeleteResponse {
  success: boolean;
  deletedFiles: string[];
  message?: string;
}

// Core Chat Interfaces

// Chat Participant Interface
export interface IChatParticipant {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userMobile: string;
  displayName?: string;
  profileImage?: ICloudinaryFile;
  role: ParticipantRole;
  permissions: ChatPermission[];
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  isMuted: boolean;
  mutedUntil?: Date;
  lastSeenAt?: Date;
  isOnline: boolean;
  lastReadMessageId?: string;
  unreadCount: number;
}

// Chat Room/Conversation Interface
export interface IChat {
  id: string;
  name?: string; // For groups and channels
  description?: string; // For groups and channels
  chatType: ChatType;
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
  participants: IChatParticipant[];
  lastMessage?: IMessage;
  lastActivity: Date;
  isArchived: boolean;
  isPinned: boolean;
  pinnedBy?: string;
  pinnedAt?: Date;
  settings: IChatSettings;
  totalMessages: number;
  unreadCount: number;
  avatar?: ICloudinaryFile; // For group/channel avatar
  coverImage?: ICloudinaryFile;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Message Interface
export interface IMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderProfileImage?: ICloudinaryFile;
  content: string;
  messageType: MessageType;
  attachments?: IMessageAttachment[];
  replyTo?: IMessageReply;
  forwardedFrom?: IMessageForward;
  reactions: IMessageReaction[];
  mentions: IMessageMention[];
  isPinned: boolean;
  pinnedBy?: string;
  pinnedAt?: Date;
  pinnedReason?: string;
  isEdited: boolean;
  editedAt?: Date;
  editHistory?: IMessageEdit[];
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  deletedFor: DeletedForType;
  deliveryStatus: MessageDeliveryStatus;
  readBy: IMessageReadReceipt[];
  threadId?: string; // For threaded replies
  threadRepliesCount: number;
  lastThreadReply?: Date;
  metadata?: Record<string, any>; // For system messages or custom data
  createdAt: Date;
  updatedAt: Date;
}

// Message Attachment Interface
export interface IMessageAttachment {
  id: string;
  messageId: string;
  file: ICloudinaryFile;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  downloadCount: number;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Date;
}

// Message Reaction Interface
export interface IMessageReaction {
  id: string;
  messageId: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: Date;
}

// Message Mention Interface
export interface IMessageMention {
  id: string;
  messageId: string;
  mentionedUserId: string;
  mentionedUserName: string;
  mentionedUserEmail: string;
  mentionType: MentionType;
  startIndex: number;
  endIndex: number;
  isRead: boolean;
  readAt?: Date;
}

// Message Reply Interface
export interface IMessageReply {
  messageId: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  attachmentCount: number;
}

// Message Forward Interface
export interface IMessageForward {
  originalMessageId: string;
  originalChatId: string;
  originalChatName?: string;
  originalSenderId: string;
  originalSenderName: string;
  forwardedBy: string;
  forwardedByName: string;
  forwardedAt: Date;
  forwardChain: number; // Track forward depth
}

// Message Edit History Interface
export interface IMessageEdit {
  id: string;
  messageId: string;
  previousContent: string;
  newContent: string;
  editedBy: string;
  editedByName: string;
  editReason?: string;
  editedAt: Date;
}

// Message Read Receipt Interface
export interface IMessageReadReceipt {
  messageId: string;
  userId: string;
  userName: string;
  readAt: Date;
}

// Chat Settings Interface
export interface IChatSettings {
  allowFileSharing: boolean;
  allowReactions: boolean;
  allowMentions: boolean;
  allowForwarding: boolean;
  allowPinning: boolean;
  allowThreads: boolean;
  allowEditing: boolean;
  allowDeleting: boolean;
  messageRetentionDays?: number; // Auto-delete messages after X days
  maxFileSize: number; // in MB
  allowedFileTypes: string[];
  muteNotifications: boolean;
  mutedUntil?: Date;
  customNotificationSound?: string;
  theme?: ChatTheme;
  language?: string;
  timezone?: string;
}

// User Chat Preferences Interface
export interface IUserChatPreferences {
  id: string;
  userId: string;
  enableNotifications: boolean;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableDesktopNotifications: boolean;
  notificationSound: string;
  messagePreview: boolean;
  onlineStatus: OnlineStatus;
  lastSeenPrivacy: LastSeenPrivacy;
  profilePrivacy: ProfilePrivacy;
  autoDownloadMedia: boolean;
  autoDownloadDocuments: boolean;
  theme: ChatTheme;
  fontSize: FontSize;
  language: string;
  timezone: string;
  blockedUsers: string[];
  mutedChats: string[];
  pinnedChats: string[];
  archivedChats: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Chat Activity Interface
export interface IChatActivity {
  id: string;
  chatId: string;
  activityType: ChatActivityType;
  performedBy: string;
  performedByName: string;
  targetUserId?: string;
  targetUserName?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Announcement Interface
export interface IAnnouncement {
  id: string;
  chatId?: string; // If null, it's a global announcement
  title: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
  priority: AnnouncementPriority;
  targetAudience: AnnouncementAudience;
  targetUserIds?: string[]; // Specific users if audience is 'specific'
  targetRoles?: string[]; // Specific roles if audience is 'role-based'
  attachments?: ICloudinaryFile[];
  isActive: boolean;
  isPinned: boolean;
  pinnedUntil?: Date;
  readBy: IAnnouncementReadReceipt[];
  totalRecipientsCount: number;
  readRecipientsCount: number;
  scheduledFor?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Announcement Read Receipt Interface
export interface IAnnouncementReadReceipt {
  announcementId: string;
  userId: string;
  userName: string;
  readAt: Date;
}

// Chat Search Interface
export interface IChatSearch {
  query: string;
  chatId?: string;
  senderId?: string;
  messageType?: MessageType;
  hasAttachments?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// Chat Search Result Interface
export interface IChatSearchResult {
  messages: IMessage[];
  totalCount: number;
  hasMore: boolean;
  highlights: Record<string, string[]>;
}

// User Search Interface
export interface IUserSearch {
  query: string;
  department?: string;
  role?: string;
  isOnline?: boolean;
  excludeUserIds?: string[];
  limit?: number;
  offset?: number;
}

// User Search Result Interface
export interface IUserSearchResult {
  users: ISearchableUser[];
  totalCount: number;
  hasMore: boolean;
}

export interface ISearchableUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  displayName?: string;
  designation?: string;
  department?: string;
  profileImage?: ICloudinaryFile;
  isOnline: boolean;
  lastSeenAt?: Date;
  mutualChats: number;
}

// Chat Statistics Interface
export interface IChatStatistics {
  totalChats: number;
  directMessages: number;
  groupChats: number;
  channels: number;
  totalMessages: number;
  totalAttachments: number;
  totalStorage: number; // in bytes
  messagesThisWeek: number;
  messagesThisMonth: number;
  mostActiveChat: {
    chatId: string;
    chatName: string;
    messageCount: number;
  };
  mostActiveUser: {
    userId: string;
    userName: string;
    messageCount: number;
  };
}

// Enums and Types
export type ChatType = 
  | 'direct'     // 1-on-1 conversation
  | 'group'      // Group chat with multiple participants
  | 'channel'    // Broadcast channel
  | 'announcement'; // Announcement only channel

export type MessageType = 
  | 'text'
  | 'image'
  | 'document'
  | 'audio'
  | 'video'
  | 'link'
  | 'location'
  | 'contact'
  | 'system'     // System generated messages
  | 'announcement'
  | 'poll'
  | 'event';

export type ParticipantRole = 
  | 'member'
  | 'admin'
  | 'moderator'
  | 'owner'
  | 'guest';

export type ChatPermission = 
  | 'send-messages'
  | 'send-attachments'
  | 'delete-own-messages'
  | 'delete-any-messages'
  | 'edit-own-messages'
  | 'edit-any-messages'
  | 'pin-messages'
  | 'react-to-messages'
  | 'mention-users'
  | 'add-participants'
  | 'remove-participants'
  | 'edit-chat-info'
  | 'manage-permissions'
  | 'create-announcements';

export type MessageDeliveryStatus = 
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type DeletedForType = 
  | 'none'       // Not deleted
  | 'sender'     // Deleted for sender only
  | 'everyone';  // Deleted for everyone

export type MentionType = 
  | 'user'       // @username
  | 'everyone'   // @everyone
  | 'here';      // @here (online users)

export type ChatActivityType = 
  | 'chat-created'
  | 'participant-added'
  | 'participant-removed'
  | 'participant-left'
  | 'participant-promoted'
  | 'participant-demoted'
  | 'chat-renamed'
  | 'chat-description-changed'
  | 'chat-avatar-changed'
  | 'chat-settings-changed'
  | 'message-pinned'
  | 'message-unpinned'
  | 'chat-archived'
  | 'chat-unarchived'
  | 'announcement-created'
  | 'announcement-updated'
  | 'user-muted'
  | 'user-unmuted';

export type AnnouncementPriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

export type AnnouncementAudience = 
  | 'everyone'
  | 'specific'     // Specific users
  | 'role-based'   // Based on roles/departments
  | 'chat-members'; // Members of specific chat

export type OnlineStatus = 
  | 'online'
  | 'offline'
  | 'away'
  | 'busy'
  | 'invisible';

export type LastSeenPrivacy = 
  | 'everyone'
  | 'contacts'
  | 'nobody';

export type ProfilePrivacy = 
  | 'everyone'
  | 'contacts'
  | 'nobody';

export type ChatTheme = 
  | 'light'
  | 'dark'
  | 'auto'
  | 'custom';

export type FontSize = 
  | 'small'
  | 'medium'
  | 'large'
  | 'extra-large';

// Request Interfaces
export interface IChatCreateRequest {
  name?: string;
  description?: string;
  chatType: ChatType;
  participantIds: string[];
  avatar?: File;
  cloudinaryAvatar?: ICloudinaryFile;
  settings?: Partial<IChatSettings>;
  isPrivate?: boolean;
}

export interface IChatUpdateRequest {
  name?: string;
  description?: string;
  avatar?: File;
  cloudinaryAvatar?: ICloudinaryFile;
  settings?: Partial<IChatSettings>;
  filesToDelete?: string[];
}

export interface IMessageSendRequest {
  chatId: string;
  content: string;
  messageType: MessageType;
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
  replyToMessageId?: string;
  mentions?: string[];
  scheduledFor?: Date;
}

export interface IMessageUpdateRequest {
  content: string;
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
  mentions?: string[];
  filesToDelete?: string[];
}

export interface IMessageForwardRequest {
  messageIds: string[];
  targetChatIds: string[];
  includeAttachments: boolean;
  addComment?: string;
}

export interface IParticipantAddRequest {
  chatId: string;
  userIds: string[];
  role?: ParticipantRole;
  permissions?: ChatPermission[];
  welcomeMessage?: string;
}

export interface IParticipantUpdateRequest {
  role?: ParticipantRole;
  permissions?: ChatPermission[];
  isMuted?: boolean;
  mutedUntil?: Date;
}

export interface IReactionAddRequest {
  messageId: string;
  emoji: string;
}

export interface IMessagePinRequest {
  messageId: string;
  reason?: string;
}

export interface IAnnouncementCreateRequest {
  chatId?: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  targetAudience: AnnouncementAudience;
  targetUserIds?: string[];
  targetRoles?: string[];
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
  scheduledFor?: Date;
  expiresAt?: Date;
}

export interface IAnnouncementUpdateRequest {
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
  expiresAt?: Date;
  filesToDelete?: string[];
}

export interface IChatPreferencesUpdateRequest {
  enableNotifications?: boolean;
  enablePushNotifications?: boolean;
  enableEmailNotifications?: boolean;
  notificationSound?: string;
  messagePreview?: boolean;
  onlineStatus?: OnlineStatus;
  lastSeenPrivacy?: LastSeenPrivacy;
  profilePrivacy?: ProfilePrivacy;
  autoDownloadMedia?: boolean;
  theme?: ChatTheme;
  fontSize?: FontSize;
  language?: string;
}

// Response Interfaces
export interface IChatApiResponse<T = unknown> extends IApiResponse<T> {
  data?: T;
}

export interface IChatWithDetails extends IChat {
  participantDetails: IChatParticipant[];
  pinnedMessages: IMessage[];
  recentMessages: IMessage[];
  unreadMessages: IMessage[];
  sharedMedia: IMessageAttachment[];
  sharedDocuments: IMessageAttachment[];
}

export interface IMessageWithDetails extends IMessage {
  chat?: IChat;
  sender?: IChatParticipant;
  replyToMessage?: IMessage;
  threadReplies?: IMessage[];
  forwardHistory?: IMessageForward[];
}

export interface IChatListResponse {
  chats: IChat[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface IMessageListResponse {
  messages: IMessage[];
  totalCount: number;
  hasMore: boolean;
  hasOlder: boolean;
}

// Dashboard Interface
export interface IChatDashboard {
  totalChats: number;
  unreadMessages: number;
  directMessages: number;
  groupChats: number;
  channels: number;
  announcements: IAnnouncement[];
  recentChats: IChat[];
  pinnedChats: IChat[];
  onlineUsers: ISearchableUser[];
  popularChats: Array<{
    chatId: string;
    chatName: string;
    participantCount: number;
    messageCount: number;
  }>;
  recentActivity: IChatActivity[];
}

// Utility Types
export type ChatFilter = {
  chatType?: ChatType[];
  hasUnread?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  participantId?: string;
  createdAfter?: Date;
  lastActivityAfter?: Date;
};

export type MessageFilter = {
  senderId?: string;
  messageType?: MessageType[];
  hasAttachments?: boolean;
  isPinned?: boolean;
  startDate?: Date;
  endDate?: Date;
  hasReactions?: boolean;
  mentionsUser?: string;
};

export type ChatSortOption = {
  sortBy: 'lastActivity' | 'name' | 'createdAt' | 'participantCount' | 'messageCount';
  sortOrder: 'asc' | 'desc';
};

export type MessageSortOption = {
  sortBy: 'createdAt' | 'reactions' | 'replies';
  sortOrder: 'asc' | 'desc';
};

export type ChatCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  chatId: string;
  chatName: string;
  eventType: 'meeting' | 'deadline' | 'reminder' | 'announcement';
  participants: string[];
  description?: string;
};

export type ChatNotification = {
  id: string;
  type: 'new-message' | 'mention' | 'reaction' | 'announcement' | 'participant-added';
  chatId: string;
  chatName: string;
  senderId?: string;
  senderName?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high';
};

export type ChatBackup = {
  chatId: string;
  chatName: string;
  messages: IMessage[];
  participants: IChatParticipant[];
  attachments: IMessageAttachment[];
  exportedAt: Date;
  exportedBy: string;
  format: 'json' | 'html' | 'pdf';
};

export type TypingIndicator = {
  chatId: string;
  userId: string;
  userName: string;
  startedAt: Date;
  isActive: boolean;
};

export type OnlineUserStatus = {
  userId: string;
  status: OnlineStatus;
  lastSeenAt: Date;
  isTyping: boolean;
  currentChatId?: string;
};

// Validation Types
export type ChatValidation = {
  canSendMessage: boolean;
  canSendAttachment: boolean;
  canDeleteMessage: boolean;
  canEditMessage: boolean;
  canPinMessage: boolean;
  canAddParticipants: boolean;
  canRemoveParticipants: boolean;
  canEditChatInfo: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  message?: string;
};

export type MessageValidation = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  contentLength: number;
  maxContentLength: number;
  attachmentCount: number;
  maxAttachmentCount: number;
  totalAttachmentSize: number;
  maxAttachmentSize: number;
};

// Real-time Event Types
export type ChatEvent = {
  type: ChatEventType;
  chatId: string;
  userId: string;
  data: any;
  timestamp: Date;
};

export type ChatEventType = 
  | 'message-sent'
  | 'message-updated'
  | 'message-deleted'
  | 'message-reaction-added'
  | 'message-reaction-removed'
  | 'message-pinned'
  | 'message-unpinned'
  | 'participant-added'
  | 'participant-removed'
  | 'participant-updated'
  | 'chat-updated'
  | 'typing-start'
  | 'typing-stop'
  | 'user-online'
  | 'user-offline'
  | 'announcement-created';

// NextAuth module declarations
declare module "next-auth" {
  interface Session {
    user: ISessionUser;
    chatPreferences?: IUserChatPreferences;
    unreadChatsCount?: number;
    onlineStatus?: OnlineStatus;
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: 'employee';
    emailVerified: boolean;
    chatPreferences?: IUserChatPreferences;
    unreadChatsCount?: number;
    onlineStatus?: OnlineStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: 'employee';
    emailVerified: boolean;
    chatPreferences?: IUserChatPreferences;
    unreadChatsCount?: number;
    onlineStatus?: OnlineStatus;
  }
}