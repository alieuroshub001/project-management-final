// app/api/chat/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/chat/Chat';
import Message from '@/models/chat/Message';
import User from '@/models/User';
import UserChatPreferences from '@/models/chat/UserChatPreferences';
import { 
  IChatApiResponse, 
  IChatSearchResult,
  IUserSearchResult,
  ISearchableUser
} from '@/types/chat';
import { authOptions } from '@/lib/auth';

// GET - Search chats, messages, and users
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
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || 'all'; // 'chats', 'messages', 'users', 'all'
    const chatId = searchParams.get('chatId'); // For message search within specific chat
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Search query is required'
      }, { status: 400 });
    }

    const results: any = {};

    if (type === 'chats' || type === 'all') {
      // Search chats
      const chats = await Chat.searchChats(query, session.user.id);
      results.chats = chats.slice(0, limit).map((chat: any) => ({
        id: chat._id.toString(),
        name: chat.name,
        description: chat.description,
        chatType: chat.chatType,
        participantCount: chat.participants.filter((p: any) => p.isActive).length,
        lastActivity: chat.lastActivity,
        avatar: chat.avatar
      }));
    }

    if (type === 'messages' || type === 'all') {
      // Search messages
      const messages = await Message.searchMessages(query, chatId || undefined, session.user.id);
      results.messages = messages.slice(0, limit).map((msg: any) => ({
        id: msg._id.toString(),
        chatId: msg.chatId.toString(),
        content: msg.content,
        senderName: msg.senderName,
        messageType: msg.messageType,
        createdAt: msg.createdAt,
        highlights: [] // Would implement text highlighting
      }));
    }

    if (type === 'users' || type === 'all') {
      // Search users
      const userPreferences = await UserChatPreferences.findByUserId(session.user.id);
      const blockedUsers = userPreferences?.blockedUsers || [];

      const users = await User.find({
        $and: [
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } }
            ]
          },
          { _id: { $ne: session.user.id } }, // Exclude current user
          { _id: { $nin: blockedUsers } }, // Exclude blocked users
          { emailVerified: true } // Only verified users
        ]
      })
      .limit(limit)
      .lean();

      const searchableUsers: ISearchableUser[] = await Promise.all(
        users.map(async (user: any) => {
          // Get mutual chats count
          const mutualChats = await Chat.countDocuments({
            'participants.userId': { $all: [session.user.id, user._id] },
            'participants.isActive': true
          });

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            displayName: user.name,
            designation: '', // Would come from profile
            department: '', // Would come from profile
            profileImage: undefined, // Would come from profile
            isOnline: false, // Would need real-time status
            lastSeenAt: undefined,
            mutualChats
          };
        })
      );

      results.users = searchableUsers;
    }

    // Calculate total counts
    const totalCounts = {
      chats: results.chats?.length || 0,
      messages: results.messages?.length || 0,
      users: results.users?.length || 0
    };

    return NextResponse.json<IChatApiResponse<any>>({
      success: true,
      message: 'Search completed successfully',
      data: {
        query,
        results,
        totalCounts,
        hasMore: Object.values(results).some((arr: any) => arr?.length === limit)
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Advanced search with filters
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

    const body = await request.json();
    const {
      query,
      type = 'all',
      chatFilters,
      messageFilters,
      userFilters,
      pagination
    } = body;

    if (!query) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Search query is required'
      }, { status: 400 });
    }

    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const results: any = {};

    if (type === 'chats' || type === 'all') {
      // Advanced chat search with filters
      let chatQuery: any = {
        'participants.userId': session.user.id,
        'participants.isActive': true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      };

      if (chatFilters) {
        if (chatFilters.chatType) chatQuery.chatType = { $in: chatFilters.chatType };
        if (chatFilters.hasUnread !== undefined) {
          chatQuery['participants.unreadCount'] = chatFilters.hasUnread ? { $gt: 0 } : 0;
        }
        if (chatFilters.isPinned !== undefined) chatQuery.isPinned = chatFilters.isPinned;
        if (chatFilters.isArchived !== undefined) chatQuery.isArchived = chatFilters.isArchived;
        if (chatFilters.lastActivityAfter) {
          chatQuery.lastActivity = { $gte: new Date(chatFilters.lastActivityAfter) };
        }
      }

      const chats = await Chat.find(chatQuery)
        .sort({ lastActivity: -1 })
        .skip(offset)
        .limit(limit);

      results.chats = chats.map((chat: any) => ({
        id: chat._id.toString(),
        name: chat.name,
        description: chat.description,
        chatType: chat.chatType,
        participantCount: chat.participants.filter((p: any) => p.isActive).length,
        lastActivity: chat.lastActivity,
        avatar: chat.avatar,
        unreadCount: chat.participants.find((p: any) => 
          p.userId.toString() === session.user.id
        )?.unreadCount || 0
      }));
    }

    if (type === 'messages' || type === 'all') {
      // Advanced message search with filters
      let messageQuery: any = {
        $text: { $search: query },
        isDeleted: false
      };

      if (messageFilters) {
        if (messageFilters.senderId) messageQuery.senderId = messageFilters.senderId;
        if (messageFilters.messageType) messageQuery.messageType = { $in: messageFilters.messageType };
        if (messageFilters.hasAttachments !== undefined) {
          messageQuery.attachments = messageFilters.hasAttachments ? 
            { $exists: true, $not: { $size: 0 } } : 
            { $exists: false };
        }
        if (messageFilters.isPinned !== undefined) messageQuery.isPinned = messageFilters.isPinned;
        if (messageFilters.startDate) {
          messageQuery.createdAt = { $gte: new Date(messageFilters.startDate) };
        }
        if (messageFilters.endDate) {
          messageQuery.createdAt = { 
            ...messageQuery.createdAt, 
            $lte: new Date(messageFilters.endDate) 
          };
        }
        if (messageFilters.mentionsUser) {
          messageQuery['mentions.mentionedUserId'] = messageFilters.mentionsUser;
        }
      }

      // Only search in chats where user is participant
      const userChats = await Chat.find({
        'participants.userId': session.user.id,
        'participants.isActive': true
      }).select('_id');
      
      messageQuery.chatId = { $in: userChats.map((chat: any) => chat._id) };

      const messages = await Message.find(messageQuery)
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('chatId', 'name chatType');

      results.messages = messages.map((msg: any) => ({
        id: msg._id.toString(),
        chatId: msg.chatId._id.toString(),
        chatName: msg.chatId.name,
        chatType: msg.chatId.chatType,
        content: msg.content,
        senderName: msg.senderName,
        messageType: msg.messageType,
        createdAt: msg.createdAt,
        attachmentCount: msg.attachments?.length || 0,
        reactionCount: msg.reactions?.length || 0
      }));
    }

    if (type === 'users' || type === 'all') {
      // Advanced user search with filters
      const userPreferences = await UserChatPreferences.findByUserId(session.user.id);
      const blockedUsers = userPreferences?.blockedUsers || [];

      let userQuery: any = {
        $and: [
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } }
            ]
          },
          { _id: { $ne: session.user.id } },
          { _id: { $nin: blockedUsers } },
          { emailVerified: true }
        ]
      };

      if (userFilters) {
        if (userFilters.department) userQuery['profile.department'] = userFilters.department;
        if (userFilters.role) userQuery.role = userFilters.role;
        if (userFilters.isOnline !== undefined) {
          // Would need real-time status implementation
        }
      }

      const users = await User.find(userQuery)
        .skip(offset)
        .limit(limit)
        .lean();

      const searchableUsers: ISearchableUser[] = await Promise.all(
        users.map(async (user: any) => {
          const mutualChats = await Chat.countDocuments({
            'participants.userId': { $all: [session.user.id, user._id] },
            'participants.isActive': true
          });

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            displayName: user.name,
            designation: '',
            department: '',
            profileImage: undefined,
            isOnline: false,
            lastSeenAt: undefined,
            mutualChats
          };
        })
      );

      results.users = searchableUsers;
    }

    return NextResponse.json<IChatApiResponse<any>>({
      success: true,
      message: 'Advanced search completed successfully',
      data: {
        query,
        results,
        pagination: {
          offset,
          limit,
          hasMore: Object.values(results).some((arr: any) => arr?.length === limit)
        }
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Advanced search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}