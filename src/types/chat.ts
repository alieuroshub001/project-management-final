// types/chat.ts
import { IApiResponse, ISessionUser } from ".";

// Cloudinary File Interface for Attachments
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

// Core Chat Interfaces
export interface IChat {
  id: string;
  name: string;
  type: ChatType;
  description?: string;
  avatar?: ICloudinaryFile;
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
  participants: IChatParticipant[];
  admins: string[]; // User IDs who are admins
  lastMessage?: IMessage;
  lastActivity: Date;
  isArchived: boolean;
  isPinned: boolean;
  settings: IChatSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: ICloudinaryFile;
  role: ParticipantRole;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  isMuted: boolean;
  lastReadMessageId?: string;
  lastReadAt?: Date;
  permissions: ChatPermission[];
}

export interface IMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar?: ICloudinaryFile;
  content: string;
  messageType: MessageType;
  replyToMessageId?: string; // For reply functionality
  mentions: string[]; // User IDs mentioned in message
  attachments: IMessageAttachment[];
  reactions: IMessageReaction[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deliveredTo: IMessageDelivery[];
  readBy: IMessageRead[];
  isPinned: boolean;
  pinnedBy?: string;
  pinnedAt?: Date;
  metadata?: Record<string, any>; // For polls, announcements, etc.
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageAttachment {
  id: string;
  messageId: string;
  file: ICloudinaryFile;
  fileType: AttachmentType;
  fileName: string;
  fileSize: number;
  description?: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface IMessageReaction {
  id: string;
  messageId: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: Date;
}

export interface IMessageDelivery {
  userId: string;
  deliveredAt: Date;
}

export interface IMessageRead {
  userId: string;
  readAt: Date;
}

export interface IChatSettings {
  allowFileUploads: boolean;
  allowPolls: boolean;
  allowAnnouncements: boolean;
  maxFileSize: number; // in MB
  allowedFileTypes: AttachmentType[];
  messageRetention: number; // days, 0 = unlimited
  requireApprovalForNewMembers: boolean;
  allowMembersToAddOthers: boolean;
  allowMembersToCreatePolls: boolean;
  muteNotifications: boolean;
}

// Poll System
export interface IPoll {
  id: string;
  messageId: string;
  chatId: string;
  createdBy: string;
  createdByName: string;
  question: string;
  options: IPollOption[];
  allowMultipleVotes: boolean;
  isAnonymous: boolean;
  expiresAt?: Date;
  isActive: boolean;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPollOption {
  id: string;
  pollId: string;
  text: string;
  voteCount: number;
  voters: IPollVote[];
}

export interface IPollVote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  userName: string;
  votedAt: Date;
}

// Announcement System
export interface IAnnouncement {
  id: string;
  messageId: string;
  chatId: string;
  createdBy: string;
  createdByName: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  targetAudience: string[]; // User IDs or 'all'
  attachments: IMessageAttachment[];
  acknowledgments: IAnnouncementAck[];
  expiresAt?: Date;
  isActive: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnnouncementAck {
  id: string;
  announcementId: string;
  userId: string;
  userName: string;
  acknowledgedAt: Date;
}

// Typing Indicator
export interface ITypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
  startedAt: Date;
  lastActivity: Date;
}

// Chat Activity Log
export interface IChatActivity {
  id: string;
  chatId: string;
  activityType: ChatActivityType;
  performedBy: string;
  performedByName: string;
  targetUserId?: string; // For member-related activities
  targetUserName?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Notification System
export interface IChatNotification {
  id: string;
  userId: string;
  chatId: string;
  messageId?: string;
  notificationType: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Enums and Types
export type ChatType = 
  | 'direct'        // 1-on-1 chat
  | 'group'         // Group chat
  | 'channel'       // Public/semi-public channel
  | 'announcement'; // Announcement-only channel

export type ParticipantRole = 
  | 'owner'         // Chat creator (cannot be changed)
  | 'admin'         // Can manage chat and members
  | 'moderator'     // Can manage messages and moderate
  | 'member'        // Regular participant
  | 'guest';        // Limited access participant

export type MessageType = 
  | 'text'
  | 'file'
  | 'image'
  | 'video'
  | 'audio'
  | 'poll'
  | 'announcement'
  | 'system'        // System-generated messages
  | 'reply';

export type AttachmentType = 
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'other';

export type ChatPermission = 
  | 'send-messages'
  | 'send-files'
  | 'create-polls'
  | 'pin-messages'
  | 'delete-messages'
  | 'edit-messages'
  | 'mention-all'
  | 'add-members'
  | 'remove-members'
  | 'manage-chat'
  | 'create-announcements';

export type AnnouncementPriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

export type ChatActivityType = 
  | 'chat-created'
  | 'chat-updated'
  | 'member-added'
  | 'member-removed'
  | 'member-promoted'
  | 'member-demoted'
  | 'member-muted'
  | 'member-unmuted'
  | 'message-pinned'
  | 'message-unpinned'
  | 'message-deleted'
  | 'poll-created'
  | 'poll-closed'
  | 'announcement-created'
  | 'chat-archived'
  | 'chat-unarchived';

export type NotificationType = 
  | 'new-message'
  | 'mention'
  | 'reply'
  | 'reaction'
  | 'poll-created'
  | 'poll-vote'
  | 'announcement'
  | 'member-added'
  | 'member-removed'
  | 'role-changed';

// Request Interfaces
export interface IChatCreateRequest {
  name: string;
  type: ChatType;
  description?: string;
  participants: string[]; // User IDs
  isPrivate?: boolean;
  settings?: Partial<IChatSettings>;
  avatar?: File;
}

export interface IChatUpdateRequest {
  name?: string;
  description?: string;
  avatar?: File;
  settings?: Partial<IChatSettings>;
  removeAvatar?: boolean;
}

export interface IMessageSendRequest {
  chatId: string;
  content: string;
  messageType?: MessageType;
  replyToMessageId?: string;
  mentions?: string[];
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
}

export interface IMessageUpdateRequest {
  content: string;
  mentions?: string[];
}

export interface IParticipantAddRequest {
  userIds: string[];
  role?: ParticipantRole;
}

export interface IParticipantUpdateRequest {
  role?: ParticipantRole;
  permissions?: ChatPermission[];
  isMuted?: boolean;
}

export interface IPollCreateRequest {
  chatId: string;
  question: string;
  options: string[];
  allowMultipleVotes?: boolean;
  isAnonymous?: boolean;
  expiresIn?: number; // hours
}

export interface IPollVoteRequest {
  pollId: string;
  optionIds: string[];
}

export interface IAnnouncementCreateRequest {
  chatId: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  targetAudience?: string[]; // If empty, targets all members
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
  expiresIn?: number; // hours
  isPinned?: boolean;
}

// Response Interfaces
export interface IChatApiResponse<T = unknown> extends IApiResponse<T> {
  data?: T;
}

export interface IChatWithDetails extends IChat {
  unreadCount: number;
  mentionsCount: number;
  recentMessages: IMessage[];
  onlineParticipants: IChatParticipant[];
  currentUserRole: ParticipantRole;
  currentUserPermissions: ChatPermission[];
}

export interface IMessageWithDetails extends IMessage {
  sender: IChatParticipant;
  replyToMessage?: IMessage;
  poll?: IPoll;
  announcement?: IAnnouncement;
  readByCount: number;
  deliveredToCount: number;
}

export interface IChatDashboard {
  totalChats: number;
  unreadMessages: number;
  totalMentions: number;
  recentChats: IChatWithDetails[];
  pinnedChats: IChatWithDetails[];
  archivedChats: IChatWithDetails[];
  recentActivity: IChatActivity[];
  onlineUsers: number;
  availableUsers: IUserStatus[];
}

export interface IUserStatus {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: ICloudinaryFile;
  status: OnlineStatus;
  lastSeen: Date;
  currentActivity?: string;
}

export type OnlineStatus = 
  | 'online'
  | 'away'
  | 'busy'
  | 'offline';

// Filter and Search Interfaces
export interface IChatFilter {
  type?: ChatType[];
  isArchived?: boolean;
  isPinned?: boolean;
  hasUnreadMessages?: boolean;
  participantId?: string;
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface IMessageFilter {
  chatId: string;
  senderId?: string;
  messageType?: MessageType[];
  hasAttachments?: boolean;
  hasMentions?: boolean;
  isUnread?: boolean;
  sentAfter?: Date;
  sentBefore?: Date;
  searchQuery?: string;
}

export interface IChatSearch {
  query: string;
  filters?: IChatFilter;
  sortBy?: 'name' | 'lastActivity' | 'createdAt' | 'unreadCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface IMessageSearch {
  query: string;
  chatIds?: string[];
  filters?: IMessageFilter;
  sortBy?: 'createdAt' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Analytics and Reports
export interface IChatAnalytics {
  chatId: string;
  totalMessages: number;
  totalParticipants: number;
  activeParticipants: number;
  messagesByDay: Array<{
    date: Date;
    count: number;
  }>;
  topSenders: Array<{
    userId: string;
    userName: string;
    messageCount: number;
    percentage: number;
  }>;
  messageTypes: Record<MessageType, number>;
  attachmentStats: {
    totalFiles: number;
    totalSize: number;
    typeBreakdown: Record<AttachmentType, number>;
  };
  pollStats: {
    totalPolls: number;
    averageParticipation: number;
    mostPopularPoll: IPoll;
  };
  peakActivity: {
    hour: number;
    day: string;
    count: number;
  };
}

// Real-time Events
export interface IChatEvent {
  eventType: ChatEventType;
  chatId: string;
  userId?: string;
  data: any;
  timestamp: Date;
}

export type ChatEventType = 
  | 'message-sent'
  | 'message-edited'
  | 'message-deleted'
  | 'message-reaction-added'
  | 'message-reaction-removed'
  | 'typing-start'
  | 'typing-stop'
  | 'user-joined'
  | 'user-left'
  | 'user-status-changed'
  | 'chat-updated'
  | 'poll-created'
  | 'poll-voted'
  | 'announcement-created'
  | 'message-read'
  | 'participant-added'
  | 'participant-removed';

// Utility Types
export type ChatSummary = {
  chatId: string;
  chatName: string;
  lastMessage: string;
  lastActivity: Date;
  unreadCount: number;
  participantCount: number;
};

export type MessageThread = {
  originalMessage: IMessage;
  replies: IMessage[];
  totalReplies: number;
  lastReply: Date;
};

export type ChatInvite = {
  id: string;
  chatId: string;
  invitedBy: string;
  invitedEmail: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  usedBy?: string;
};

// NextAuth module declarations
declare module "next-auth" {
  interface Session {
    user: ISessionUser;
    chatStatus?: IUserStatus;
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: 'employee';
    emailVerified: boolean;
    chatStatus?: IUserStatus;
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
    chatStatus?: IUserStatus;
  }
}