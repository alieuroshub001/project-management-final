// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { Chat, ChatParticipant, Message, IChatDocument, IChatParticipantDocument } from '@/models/Chat';
import User from '@/models/User';
import { 
  IChatCreateRequest, 
  IChatApiResponse, 
  IChat,
  IChatWithDetails,
  IChatSearch,
  IChatFilter,
  ChatType,
  ParticipantRole
} from '@/types/chat';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to IChat
function convertToIChat(doc: IChatDocument): IChat {
  return {
    id: (doc._id as string | { toString(): string }).toString(),
    name: doc.name,
    type: doc.type as ChatType,
    description: doc.description,
    avatar: doc.avatar,
    createdBy: doc.createdBy.toString(),
    createdByName: doc.createdByName,
    createdByEmail: doc.createdByEmail,
    participants: doc.participants.map(p => p.toString()),
    admins: doc.admins.map(a => a.toString()),
    lastMessage: undefined, // Will be populated separately if needed
    lastActivity: doc.lastActivity,
    isArchived: doc.isArchived,
    isPinned: doc.isPinned,
    settings: {
      allowFileUploads: doc.settings.allowFileUploads,
      allowPolls: doc.settings.allowPolls,
      allowAnnouncements: doc.settings.allowAnnouncements,
      maxFileSize: doc.settings.maxFileSize,
      allowedFileTypes: doc.settings.allowedFileTypes as any,
      messageRetention: doc.settings.messageRetention,
      requireApprovalForNewMembers: doc.settings.requireApprovalForNewMembers,
      allowMembersToAddOthers: doc.settings.allowMembersToAddOthers,
      allowMembersToCreatePolls: doc.settings.allowMembersToCreatePolls,
      muteNotifications: doc.settings.muteNotifications
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// Helper function to get default permissions based on role
function getDefaultPermissions(role: ParticipantRole): string[] {
  switch (role) {
    case 'owner':
    case 'admin':
      return [
        'send-messages', 'send-files', 'create-polls', 'pin-messages',
        'delete-messages', 'edit-messages', 'mention-all', 'add-members',
        'remove-members', 'manage-chat', 'create-announcements'
      ];
    case 'moderator':
      return [
        'send-messages', 'send-files', 'create-polls', 'pin-messages',
        'delete-messages', 'edit-messages', 'mention-all', 'create-announcements'
      ];
    case 'member':
      return ['send-messages', 'send-files'];
    case 'guest':
      return ['send-messages'];
    default:
      return ['send-messages'];
  }
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
    const query = searchParams.get('query') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'lastActivity';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Parse filters
    const type = searchParams.get('type')?.split(',') as ChatType[] || [];
    const isArchived = searchParams.get('isArchived');
    const isPinned = searchParams.get('isPinned');
    const hasUnreadMessages = searchParams.get('hasUnreadMessages');
    const createdBy = searchParams.get('createdBy');

    // Build filter object - user can only see chats they participate in
    const userParticipants = await ChatParticipant.find({
      userId: session.user.id,
      isActive: true
    }).select('chatId');

    const chatIds = userParticipants.map(p => p.chatId);
    
    const filter: any = {
      _id: { $in: chatIds }
    };

    if (type.length > 0) filter.type = { $in: type };
    if (isArchived !== null) filter.isArchived = isArchived === 'true';
    if (isPinned !== null) filter.isPinned = isPinned === 'true';
    if (createdBy) filter.createdBy = createdBy;

    // Add text search if query provided
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [chats, total] = await Promise.all([
      Chat.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean() as Promise<IChatDocument[]>,
      Chat.countDocuments(filter)
    ]);

    // Convert to IChat and get additional details if needed
    const convertedChats = await Promise.all(
      chats.map(async (chat) => {
        const basicChat = convertToIChat(chat);
        
        // Get last message if exists
        if (chat.lastMessageId) {
          const lastMessage = await Message.findById(chat.lastMessageId).lean();
          if (lastMessage) {
            basicChat.lastMessage = {
              id: lastMessage._id.toString(),
              chatId: lastMessage.chatId.toString(),
              senderId: lastMessage.senderId.toString(),
              senderName: lastMessage.senderName,
              senderEmail: lastMessage.senderEmail,
              senderAvatar: lastMessage.senderAvatar,
              content: lastMessage.content,
              messageType: lastMessage.messageType as any,
              replyToMessageId: lastMessage.replyToMessageId?.toString(),
              mentions: lastMessage.mentions,
              attachments: [], // Will be populated separately if needed
              reactions: lastMessage.reactions.map(r => ({
                id: r.id,
                messageId: lastMessage._id.toString(),
                userId: r.userId,
                userName: r.userName,
                emoji: r.emoji,
                createdAt: r.createdAt
              })),
              isEdited: lastMessage.isEdited,
              editedAt: lastMessage.editedAt,
              isDeleted: lastMessage.isDeleted,
              deletedAt: lastMessage.deletedAt,
              deliveredTo: lastMessage.deliveredTo.map(d => ({
                userId: d.userId,
                deliveredAt: d.deliveredAt
              })),
              readBy: lastMessage.readBy.map(r => ({
                userId: r.userId,
                readAt: r.readAt
              })),
              isPinned: lastMessage.isPinned,
              pinnedBy: lastMessage.pinnedBy?.toString(),
              pinnedAt: lastMessage.pinnedAt,
              metadata: lastMessage.metadata,
              createdAt: lastMessage.createdAt,
              updatedAt: lastMessage.updatedAt
            };
          }
        }

        return basicChat;
      })
    );

    return NextResponse.json<IChatApiResponse<{
      chats: IChat[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    }>>({
      success: true,
      message: 'Chats retrieved successfully',
      data: {
        chats: convertedChats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
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
      type,
      description,
      participants = [],
      admins = [],
      isPrivate = false,
      settings
    } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Name and type are required'
      }, { status: 400 });
    }

    // Validate participants exist
    if (participants.length > 0) {
      const users = await User.find({ _id: { $in: participants } });
      if (users.length !== participants.length) {
        return NextResponse.json<IChatApiResponse>({
          success: false,
          message: 'Some participants not found'
        }, { status: 400 });
      }
    }

    // For direct chats, ensure exactly 2 participants
    if (type === 'direct') {
      if (participants.length !== 1) {
        return NextResponse.json<IChatApiResponse>({
          success: false,
          message: 'Direct chats must have exactly one other participant'
        }, { status: 400 });
      }

      // Check if direct chat already exists
      const existingDirectChat = await Chat.findDirectChat(session.user.id, participants[0]);
      if (existingDirectChat) {
        return NextResponse.json<IChatApiResponse>({
          success: false,
          message: 'Direct chat with this user already exists'
        }, { status: 400 });
      }
    }

    // Default settings
    const defaultSettings = {
      allowFileUploads: true,
      allowPolls: true,
      allowAnnouncements: type === 'channel' || type === 'announcement',
      maxFileSize: 50,
      allowedFileTypes: ['image', 'video', 'audio', 'document', 'spreadsheet', 'presentation', 'archive', 'other'],
      messageRetention: 0,
      requireApprovalForNewMembers: isPrivate,
      allowMembersToAddOthers: type !== 'direct' && !isPrivate,
      allowMembersToCreatePolls: type !== 'direct',
      muteNotifications: false,
      ...settings
    };

    // Create chat
    const chatData = {
      name,
      type,
      description,
      createdBy: session.user.id,
      createdByName: session.user.name,
      createdByEmail: session.user.email,
      participants: [], // Will be populated after creating participants
      admins: [...admins, session.user.id], // Creator is always admin
      settings: defaultSettings
    };

    const chat = await Chat.create(chatData) as IChatDocument;

    // Create chat participants
    const participantPromises = [];

    // Add creator as owner
    participantPromises.push(
      ChatParticipant.create({
        chatId: chat._id,
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        role: 'owner',
        permissions: getDefaultPermissions('owner')
      })
    );

    // Add other participants
    if (participants.length > 0) {
      const users = await User.find({ _id: { $in: participants } });
      
      for (const user of users) {
        const role: ParticipantRole = admins.includes(user._id.toString()) ? 'admin' : 'member';
        participantPromises.push(
          ChatParticipant.create({
            chatId: chat._id,
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            role,
            permissions: getDefaultPermissions(role)
          })
        );
      }
    }

    const createdParticipants = await Promise.all(participantPromises) as IChatParticipantDocument[];

    // Update chat with participant IDs
    chat.participants = createdParticipants.map(p => p._id as any);
    await chat.save();

    // For direct chats, set name to the other participant's name
    if (type === 'direct' && createdParticipants.length === 2) {
      const otherParticipant = createdParticipants.find(p => p.userId.toString() !== session.user.id);
      if (otherParticipant) {
        chat.name = otherParticipant.userName;
        await chat.save();
      }
    }

    return NextResponse.json<IChatApiResponse<IChat>>({
      success: true,
      message: 'Chat created successfully',
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