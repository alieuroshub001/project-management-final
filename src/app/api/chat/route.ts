// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/chat/Chat';
import User from '@/models/User';
import UserChatPreferences from '@/models/chat/UserChatPreferences';
import ChatActivity from '@/models/chat/ChatActivity';
import { 
  IChatCreateRequest,
  IChatApiResponse, 
  IChat,
  IChatListResponse,
  ChatFilter
} from '@/types/chat';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to IChat
function convertToIChat(doc: any): IChat {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    chatType: doc.chatType,
    createdBy: doc.createdBy.toString(),
    createdByName: doc.createdByName,
    createdByEmail: doc.createdByEmail,
    participants: doc.participants.map((p: any) => ({
      id: p.id,
      userId: p.userId.toString(),
      userName: p.userName,
      userEmail: p.userEmail,
      userMobile: p.userMobile,
      displayName: p.displayName,
      profileImage: p.profileImage,
      role: p.role,
      permissions: p.permissions,
      joinedAt: p.joinedAt,
      leftAt: p.leftAt,
      isActive: p.isActive,
      isMuted: p.isMuted,
      mutedUntil: p.mutedUntil,
      lastSeenAt: p.lastSeenAt,
      isOnline: p.isOnline,
      lastReadMessageId: p.lastReadMessageId,
      unreadCount: p.unreadCount
    })),
    lastMessage: doc.lastMessage,
    lastActivity: doc.lastActivity,
    isArchived: doc.isArchived,
    isPinned: doc.isPinned,
    pinnedBy: doc.pinnedBy,
    pinnedAt: doc.pinnedAt,
    settings: doc.settings,
    totalMessages: doc.totalMessages,
    unreadCount: doc.unreadCount,
    avatar: doc.avatar,
    coverImage: doc.coverImage,
    tags: doc.tags,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// GET - List chats with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const chatType = searchParams.get('chatType');
    const hasUnread = searchParams.get('hasUnread');
    const isPinned = searchParams.get('isPinned');
    const isArchived = searchParams.get('isArchived');
    const query = searchParams.get('query') || '';

    // Build filter object
    const filters: ChatFilter = {};
    if (chatType) filters.chatType = [chatType as any];
    if (hasUnread !== null) filters.hasUnread = hasUnread === 'true';
    if (isPinned !== null) filters.isPinned = isPinned === 'true';
    if (isArchived !== null) filters.isArchived = isArchived === 'true';

    let chats;
    let total;

    if (query) {
      // Search chats
      chats = await Chat.searchChats(query, session.user.id);
      total = chats.length;
      
      // Apply pagination to search results
      const skip = (page - 1) * limit;
      chats = chats.slice(skip, skip + limit);
    } else {
      // Get user chats with filters
      const mongoFilters = {
        ...filters,
        limit,
        page
      };
      
      chats = await Chat.findUserChats(session.user.id, mongoFilters);
      total = await Chat.countDocuments({
        'participants.userId': session.user.id,
        'participants.isActive': true,
        ...(filters.chatType && { chatType: { $in: filters.chatType } }),
        ...(filters.isPinned !== undefined && { isPinned: filters.isPinned }),
        ...(filters.isArchived !== undefined && { isArchived: filters.isArchived })
      });
    }

    // Get user's unread count
    const unreadCount = await Chat.getUnreadCount(session.user.id);

    const response: IChatListResponse = {
      chats: chats.map(convertToIChat),
      totalCount: total,
      unreadCount,
      hasMore: page * limit < total
    };

    return NextResponse.json<IChatApiResponse<IChatListResponse>>({
      success: true,
      message: 'Chats retrieved successfully',
      data: response
    });

  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to retrieve chats',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new chat
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const body: IChatCreateRequest = await request.json();
    const {
      name,
      description,
      chatType,
      participantIds,
      cloudinaryAvatar,
      settings,
      isPrivate = false
    } = body;

    // Validate required fields
    if (!chatType || !participantIds || participantIds.length === 0) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat type and participants are required'
      }, { status: 400 });
    }

    // Validate chat type specific requirements
    if (chatType === 'direct' && participantIds.length !== 1) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Direct messages must have exactly one other participant'
      }, { status: 400 });
    }

    if ((chatType === 'group' || chatType === 'channel') && !name) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Group chats and channels must have a name'
      }, { status: 400 });
    }

    // For direct messages, check if chat already exists
    if (chatType === 'direct') {
      const existingChat = await Chat.findDirectChat(session.user.id, participantIds[0]);
      if (existingChat) {
        return NextResponse.json<IChatApiResponse<IChat>>({
          success: true,
          message: 'Direct chat already exists',
          data: convertToIChat(existingChat)
        });
      }
    }

    // Get participant details
    const allParticipantIds = [session.user.id, ...participantIds];
    const users = await User.find({ _id: { $in: allParticipantIds } }).lean();
    
    if (users.length !== allParticipantIds.length) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'One or more participants not found'
      }, { status: 400 });
    }

    // Build participants array
    const participants = users.map(user => {
      const isCreator = user._id.toString() === session.user.id;
      return {
        id: user._id.toString(),
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        userMobile: user.mobile,
        displayName: user.name,
        role: isCreator ? 'owner' : 'member',
        permissions: [],
        joinedAt: new Date(),
        isActive: true,
        isMuted: false,
        isOnline: false,
        unreadCount: 0
      };
    });

    const chatData = {
      name: chatType === 'direct' ? undefined : name,
      description,
      chatType,
      createdBy: session.user.id,
      createdByName: session.user.name,
      createdByEmail: session.user.email,
      participants,
      settings: {
        allowFileSharing: true,
        allowReactions: true,
        allowMentions: true,
        allowForwarding: true,
        allowPinning: true,
        allowThreads: true,
        allowEditing: true,
        allowDeleting: true,
        maxFileSize: 50,
        allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'],
        muteNotifications: false,
        theme: 'auto',
        language: 'en',
        timezone: 'UTC',
        ...settings
      },
      avatar: cloudinaryAvatar,
      tags: []
    };

    const chat = await Chat.create(chatData);

    // Create chat activity
    await ChatActivity.createActivity({
      chatId: chat._id as mongoose.Types.ObjectId,
      activityType: 'chat-created',
      performedBy: new mongoose.Types.ObjectId(session.user.id),
      performedByName: session.user.name,
      description: `${chatType === 'direct' ? 'Direct message' : `${chatType} "${name}"`} was created`,
      metadata: { chatType, participantCount: participants.length }
    });

    // Add participants to activity log
    for (const participant of participants) {
      if (participant.userId.toString() !== session.user.id) {
        await ChatActivity.createActivity({
          chatId: chat._id as mongoose.Types.ObjectId,
          activityType: 'participant-added',
          performedBy: new mongoose.Types.ObjectId(session.user.id),
          performedByName: session.user.name,
          targetUserId: participant.userId as mongoose.Types.ObjectId,
          targetUserName: participant.userName,
          description: `${participant.userName} was added to the ${chatType}`,
          metadata: { role: participant.role }
        });
      }
    }

    return NextResponse.json<IChatApiResponse<IChat>>({
      success: true,
      message: `${chatType === 'direct' ? 'Direct message' : 'Chat'} created successfully`,
      data: convertToIChat(chat)
    }, { status: 201 });

  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to create chat',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}