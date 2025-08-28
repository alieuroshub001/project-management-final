// app/api/chat/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { 
  Chat, 
  ChatParticipant, 
  Message, 
  ChatActivity,
  IChatDocument, 
  IChatParticipantDocument 
} from '@/models/Chat';
import { 
  IChatUpdateRequest,
  IChatApiResponse, 
  IChat,
  IChatWithDetails,
  ChatType,
  ParticipantRole,
  ChatPermission
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
    lastMessage: undefined,
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

// Check if user has access to chat
async function hasChatAccess(chatId: string, userId: string): Promise<boolean> {
  const participant = await ChatParticipant.findOne({
    chatId,
    userId,
    isActive: true
  });
  return !!participant;
}

// Check if user has specific permission
async function hasPermission(chatId: string, userId: string, permission: ChatPermission): Promise<boolean> {
  const participant = await ChatParticipant.findOne({
    chatId,
    userId,
    isActive: true
  });
  
  if (!participant) return false;
  
  // Check if user is chat creator/admin
  const chat = await Chat.findById(chatId);
  if (chat && (chat.createdBy.toString() === userId || chat.isAdmin(userId))) {
    return true;
  }
  
  return participant.hasPermission(permission);
}

// GET - Get single chat with details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const params = await context.params;
    const chatId = params.id;

    // Check access
    const hasAccess = await hasChatAccess(chatId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    const chat = await Chat.findById(chatId) as IChatDocument | null;
    if (!chat) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    // Get additional details
    const [participants, recentMessages, recentActivity, currentUserParticipant] = await Promise.all([
      ChatParticipant.find({ chatId, isActive: true }).populate('userId', 'name email mobile'),
      Message.findByChatId(chatId, 50),
      ChatActivity.find({ chatId }).sort({ createdAt: -1 }).limit(20),
      ChatParticipant.findOne({ chatId, userId: session.user.id, isActive: true })
    ]);

    // Get unread count for current user
    const unreadMessages = await Message.findUnreadMessages(session.user.id, chatId);
    const unreadCount = unreadMessages.length;

    // Get mentions count
    const mentionsCount = unreadMessages.filter(msg => 
      msg.mentions.includes(session.user.id)
    ).length;

    // Convert participants
    const convertedParticipants = participants.map(p => ({
      id: (p._id as any).toString(),
      chatId: p.chatId.toString(),
      userId: p.userId.toString(),
      userName: p.userName,
      userEmail: p.userEmail,
      userAvatar: p.userAvatar,
      role: p.role as ParticipantRole,
      joinedAt: p.joinedAt,
      leftAt: p.leftAt,
      isActive: p.isActive,
      isMuted: p.isMuted,
      lastReadMessageId: p.lastReadMessageId?.toString(),
      lastReadAt: p.lastReadAt,
      permissions: p.permissions as ChatPermission[]
    }));

    // Convert messages
    const convertedMessages = recentMessages.map(msg => ({
      id: (msg._id as any).toString(),
      chatId: msg.chatId.toString(),
      senderId: msg.senderId.toString(),
      senderName: msg.senderName,
      senderEmail: msg.senderEmail,
      senderAvatar: msg.senderAvatar,
      content: msg.content,
      messageType: msg.messageType as any,
      replyToMessageId: msg.replyToMessageId?.toString(),
      mentions: msg.mentions,
      attachments: [], // Will be populated if needed
      reactions: msg.reactions.map(r => ({
        id: r.id,
        messageId: (msg._id as any).toString(),
        userId: r.userId,
        userName: r.userName,
        emoji: r.emoji,
        createdAt: r.createdAt
      })),
      isEdited: msg.isEdited,
      editedAt: msg.editedAt,
      isDeleted: msg.isDeleted,
      deletedAt: msg.deletedAt,
      deliveredTo: msg.deliveredTo.map(d => ({
        userId: d.userId,
        deliveredAt: d.deliveredAt
      })),
      readBy: msg.readBy.map(r => ({
        userId: r.userId,
        readAt: r.readAt
      })),
      isPinned: msg.isPinned,
      pinnedBy: msg.pinnedBy?.toString(),
      pinnedAt: msg.pinnedAt,
      metadata: msg.metadata,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt
    }));

    // Convert activity
    const convertedActivity = recentActivity.map(activity => ({
      id: activity._id.toString(),
      chatId: activity.chatId.toString(),
      activityType: activity.activityType as any,
      performedBy: activity.performedBy.toString(),
      performedByName: activity.performedByName,
      targetUserId: activity.targetUserId,
      targetUserName: activity.targetUserName,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.createdAt
    }));

    // Get online participants (this would typically come from a real-time system)
    const onlineParticipants = convertedParticipants.filter(p => 
      // For now, assume all are online. In real implementation, 
      // this would check against a Redis store or WebSocket connections
      true
    );

    const chatWithDetails: IChatWithDetails = {
      ...convertToIChat(chat),
      unreadCount,
      mentionsCount,
      recentMessages: convertedMessages,
      onlineParticipants: onlineParticipants,
      currentUserRole: currentUserParticipant?.role as ParticipantRole || 'member',
      currentUserPermissions: currentUserParticipant?.permissions as ChatPermission[] || []
    };

    return NextResponse.json<IChatApiResponse<IChatWithDetails>>({
      success: true,
      message: 'Chat retrieved successfully',
      data: chatWithDetails
    });

  } catch (error) {
    console.error('Get chat error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to retrieve chat',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update chat
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const params = await context.params;
    const chatId = params.id;

    // Check if user can manage chat
    const canManage = await hasPermission(chatId, session.user.id, 'manage-chat');
    if (!canManage) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Insufficient permissions to update this chat'
      }, { status: 403 });
    }

    const chat = await Chat.findById(chatId) as IChatDocument | null;
    if (!chat) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    const body: IChatUpdateRequest = await request.json();
    const { name, description, settings, removeAvatar } = body;

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (settings !== undefined) {
      updateData.settings = { ...chat.settings, ...settings };
    }

    // Handle avatar removal
    if (removeAvatar) {
      updateData.$unset = { avatar: 1 };
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      updateData,
      { new: true }
    ) as IChatDocument | null;

    if (!updatedChat) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Failed to update chat'
      }, { status: 500 });
    }

    // Create activity log
    await ChatActivity.create({
      chatId,
      activityType: 'chat-updated',
      performedBy: session.user.id,
      performedByName: session.user.name,
      description: `Chat "${updatedChat.name}" was updated`,
      metadata: { updatedFields: Object.keys(updateData) }
    });

    // Update last activity
    await updatedChat.updateLastActivity();

    return NextResponse.json<IChatApiResponse<IChat>>({
      success: true,
      message: 'Chat updated successfully',
      data: convertToIChat(updatedChat)
    });

  } catch (error) {
    console.error('Update chat error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to update chat',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Archive chat (soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const params = await context.params;
    const chatId = params.id;

    const chat = await Chat.findById(chatId) as IChatDocument | null;
    if (!chat) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    // Only creator or admin can archive chat
    if (chat.createdBy.toString() !== session.user.id && !chat.isAdmin(session.user.id)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Insufficient permissions to archive this chat'
      }, { status: 403 });
    }

    // Archive the chat
    const archivedChat = await Chat.findByIdAndUpdate(
      chatId,
      { isArchived: true },
      { new: true }
    ) as IChatDocument | null;

    if (!archivedChat) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Failed to archive chat'
      }, { status: 500 });
    }

    // Create activity log
    await ChatActivity.create({
      chatId,
      activityType: 'chat-archived',
      performedBy: session.user.id,
      performedByName: session.user.name,
      description: `Chat "${chat.name}" was archived`
    });

    return NextResponse.json<IChatApiResponse>({
      success: true,
      message: 'Chat archived successfully'
    });

  } catch (error) {
    console.error('Archive chat error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to archive chat',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}