// app/api/chat/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/chat/Chat';
import Message from '@/models/chat/Message';
import ChatActivity from '@/models/chat/ChatActivity';
import { 
  IChatUpdateRequest,
  IChatApiResponse, 
  IChat,
  IChatWithDetails
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

// Check if user has access to chat
async function hasChatAccess(chatId: string, userId: string): Promise<boolean> {
  const chat = await Chat.findById(chatId);
  return chat ? chat.isParticipant(userId) : false;
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

    // Check access
    const hasAccess = await hasChatAccess(params.id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    const chat = await Chat.findById(params.id).populate('lastMessageId');
    if (!chat) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('includeDetails') === 'true';

    if (includeDetails) {
      // Get additional details
      const [pinnedMessages, recentMessages, unreadMessages, sharedMedia] = await Promise.all([
        Message.findPinnedMessages(params.id),
        Message.findByChat(params.id, 20),
        Message.findUnreadMessages(params.id, session.user.id),
        Message.find({
          chatId: params.id,
          messageType: { $in: ['image', 'video', 'audio'] },
          isDeleted: false
        }).limit(50).sort({ createdAt: -1 })
      ]);

      const sharedDocuments = await Message.find({
        chatId: params.id,
        messageType: 'document',
        isDeleted: false
      }).limit(50).sort({ createdAt: -1 });

      const chatWithDetails: IChatWithDetails = {
        ...convertToIChat(chat),
        participantDetails: chat.participants.filter((p: any) => p.isActive).map((p: any) => ({
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
        pinnedMessages: pinnedMessages.map((msg: any) => ({
          id: msg._id.toString(),
          chatId: msg.chatId.toString(),
          senderId: msg.senderId.toString(),
          senderName: msg.senderName,
          senderEmail: msg.senderEmail,
          senderProfileImage: msg.senderProfileImage,
          content: msg.content,
          messageType: msg.messageType,
          attachments: msg.attachments?.map((att: any) => ({
            id: att.id,
            messageId: msg._id.toString(),
            file: att.file,
            fileName: att.fileName,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            thumbnailUrl: att.thumbnailUrl,
            previewUrl: att.previewUrl,
            downloadCount: att.downloadCount,
            uploadedBy: att.uploadedBy,
            uploadedByName: att.uploadedByName,
            createdAt: att.createdAt
          })),
          replyTo: msg.replyTo,
          forwardedFrom: msg.forwardedFrom,
          reactions: msg.reactions?.map((r: any) => ({
            id: r.id,
            messageId: msg._id.toString(),
            userId: r.userId.toString(),
            userName: r.userName,
            emoji: r.emoji,
            createdAt: r.createdAt
          })),
          mentions: msg.mentions?.map((m: any) => ({
            id: m.id,
            messageId: msg._id.toString(),
            mentionedUserId: m.mentionedUserId.toString(),
            mentionedUserName: m.mentionedUserName,
            mentionedUserEmail: m.mentionedUserEmail,
            mentionType: m.mentionType,
            startIndex: m.startIndex,
            endIndex: m.endIndex,
            isRead: m.isRead,
            readAt: m.readAt
          })),
          isPinned: msg.isPinned,
          pinnedBy: msg.pinnedBy,
          pinnedAt: msg.pinnedAt,
          pinnedReason: msg.pinnedReason,
          isEdited: msg.isEdited,
          editedAt: msg.editedAt,
          editHistory: msg.editHistory,
          isDeleted: msg.isDeleted,
          deletedAt: msg.deletedAt,
          deletedBy: msg.deletedBy,
          deletedFor: msg.deletedFor,
          deliveryStatus: msg.deliveryStatus,
          readBy: msg.readBy?.map((r: any) => ({
            messageId: msg._id.toString(),
            userId: r.userId.toString(),
            userName: r.userName,
            readAt: r.readAt
          })),
          threadId: msg.threadId,
          threadRepliesCount: msg.threadRepliesCount,
          lastThreadReply: msg.lastThreadReply,
          metadata: msg.metadata,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt
        })),
        recentMessages: recentMessages.map((msg: any) => ({
          id: msg._id.toString(),
          chatId: msg.chatId.toString(),
          senderId: msg.senderId.toString(),
          senderName: msg.senderName,
          senderEmail: msg.senderEmail,
          senderProfileImage: msg.senderProfileImage,
          content: msg.content,
          messageType: msg.messageType,
          attachments: msg.attachments?.map((att: any) => ({
            id: att.id,
            messageId: msg._id.toString(),
            file: att.file,
            fileName: att.fileName,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            thumbnailUrl: att.thumbnailUrl,
            previewUrl: att.previewUrl,
            downloadCount: att.downloadCount,
            uploadedBy: att.uploadedBy,
            uploadedByName: att.uploadedByName,
            createdAt: att.createdAt
          })),
          replyTo: msg.replyTo,
          forwardedFrom: msg.forwardedFrom,
          reactions: msg.reactions?.map((r: any) => ({
            id: r.id,
            messageId: msg._id.toString(),
            userId: r.userId.toString(),
            userName: r.userName,
            emoji: r.emoji,
            createdAt: r.createdAt
          })),
          mentions: msg.mentions?.map((m: any) => ({
            id: m.id,
            messageId: msg._id.toString(),
            mentionedUserId: m.mentionedUserId.toString(),
            mentionedUserName: m.mentionedUserName,
            mentionedUserEmail: m.mentionedUserEmail,
            mentionType: m.mentionType,
            startIndex: m.startIndex,
            endIndex: m.endIndex,
            isRead: m.isRead,
            readAt: m.readAt
          })),
          isPinned: msg.isPinned,
          pinnedBy: msg.pinnedBy,
          pinnedAt: msg.pinnedAt,
          pinnedReason: msg.pinnedReason,
          isEdited: msg.isEdited,
          editedAt: msg.editedAt,
          editHistory: msg.editHistory,
          isDeleted: msg.isDeleted,
          deletedAt: msg.deletedAt,
          deletedBy: msg.deletedBy,
          deletedFor: msg.deletedFor,
          deliveryStatus: msg.deliveryStatus,
          readBy: msg.readBy?.map((r: any) => ({
            messageId: msg._id.toString(),
            userId: r.userId.toString(),
            userName: r.userName,
            readAt: r.readAt
          })),
          threadId: msg.threadId,
          threadRepliesCount: msg.threadRepliesCount,
          lastThreadReply: msg.lastThreadReply,
          metadata: msg.metadata,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt
        })),
        unreadMessages: unreadMessages.map((msg: any) => ({
          id: msg._id.toString(),
          chatId: msg.chatId.toString(),
          senderId: msg.senderId.toString(),
          senderName: msg.senderName,
          senderEmail: msg.senderEmail,
          senderProfileImage: msg.senderProfileImage,
          content: msg.content,
          messageType: msg.messageType,
          attachments: msg.attachments?.map((att: any) => ({
            id: att.id,
            messageId: msg._id.toString(),
            file: att.file,
            fileName: att.fileName,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            thumbnailUrl: att.thumbnailUrl,
            previewUrl: att.previewUrl,
            downloadCount: att.downloadCount,
            uploadedBy: att.uploadedBy,
            uploadedByName: att.uploadedByName,
            createdAt: att.createdAt
          })),
          replyTo: msg.replyTo,
          forwardedFrom: msg.forwardedFrom,
          reactions: msg.reactions?.map((r: any) => ({
            id: r.id,
            messageId: msg._id.toString(),
            userId: r.userId.toString(),
            userName: r.userName,
            emoji: r.emoji,
            createdAt: r.createdAt
          })),
          mentions: msg.mentions?.map((m: any) => ({
            id: m.id,
            messageId: msg._id.toString(),
            mentionedUserId: m.mentionedUserId.toString(),
            mentionedUserName: m.mentionedUserName,
            mentionedUserEmail: m.mentionedUserEmail,
            mentionType: m.mentionType,
            startIndex: m.startIndex,
            endIndex: m.endIndex,
            isRead: m.isRead,
            readAt: m.readAt
          })),
          isPinned: msg.isPinned,
          pinnedBy: msg.pinnedBy,
          pinnedAt: msg.pinnedAt,
          pinnedReason: msg.pinnedReason,
          isEdited: msg.isEdited,
          editedAt: msg.editedAt,
          editHistory: msg.editHistory,
          isDeleted: msg.isDeleted,
          deletedAt: msg.deletedAt,
          deletedBy: msg.deletedBy,
          deletedFor: msg.deletedFor,
          deliveryStatus: msg.deliveryStatus,
          readBy: msg.readBy?.map((r: any) => ({
            messageId: msg._id.toString(),
            userId: r.userId.toString(),
            userName: r.userName,
            readAt: r.readAt
          })),
          threadId: msg.threadId,
          threadRepliesCount: msg.threadRepliesCount,
          lastThreadReply: msg.lastThreadReply,
          metadata: msg.metadata,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt
        })),
        sharedMedia: sharedMedia.map((msg: any) => msg.attachments || []).flat(),
        sharedDocuments: sharedDocuments.map((msg: any) => msg.attachments || []).flat()
      };

      return NextResponse.json<IChatApiResponse<IChatWithDetails>>({
        success: true,
        message: 'Chat details retrieved successfully',
        data: chatWithDetails
      });
    }

    // Mark chat as read
    await Message.markChatAsRead(params.id, session.user.id);

    return NextResponse.json<IChatApiResponse<IChat>>({
      success: true,
      message: 'Chat retrieved successfully',
      data: convertToIChat(chat)
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

    const chat = await Chat.findById(params.id);
    if (!chat) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    // Check if user can edit chat info
    if (!chat.canUserPerformAction(session.user.id, 'edit-chat-info')) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Insufficient permissions to edit this chat'
      }, { status: 403 });
    }

    const body: IChatUpdateRequest = await request.json();
    const {
      name,
      description,
      cloudinaryAvatar,
      settings,
      filesToDelete
    } = body;

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (settings !== undefined) updateData.settings = { ...chat.settings, ...settings };

    // Handle avatar
    if (cloudinaryAvatar) {
      updateData.avatar = cloudinaryAvatar;
    }

    // Handle file deletion
    if (filesToDelete && filesToDelete.length > 0) {
      if (chat.avatar && filesToDelete.includes(chat.avatar.public_id)) {
        updateData.avatar = undefined;
      }
      if (chat.coverImage && filesToDelete.includes(chat.coverImage.public_id)) {
        updateData.coverImage = undefined;
      }
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );

    if (!updatedChat) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Failed to update chat'
      }, { status: 500 });
    }

    // Create activity log
    const changedFields = Object.keys(updateData);
    await ChatActivity.createActivity({
      chatId: new mongoose.Types.ObjectId(params.id),
      activityType: 'chat-settings-changed',
      performedBy: new mongoose.Types.ObjectId(session.user.id),
      performedByName: session.user.name,
      description: `Chat settings were updated`,
      metadata: { changedFields }
    });

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

// DELETE - Leave/Delete chat
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

    const chat = await Chat.findById(params.id);
    if (!chat) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    // Check access
    if (!chat.isParticipant(session.user.id)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'You are not a participant in this chat'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'leave'; // 'leave' or 'delete'

    if (action === 'delete') {
      // Only chat owner/creator can delete
      if (chat.createdBy.toString() !== session.user.id) {
        return NextResponse.json<IChatApiResponse>({
          success: false,
          message: 'Only the chat creator can delete this chat'
        }, { status: 403 });
      }

      // Soft delete - mark as archived instead of hard delete
      await Chat.findByIdAndUpdate(params.id, { isArchived: true });

      // Create activity log
      await ChatActivity.createActivity({
        chatId: new mongoose.Types.ObjectId(params.id),
        activityType: 'chat-archived',
        performedBy: new mongoose.Types.ObjectId(session.user.id),
        performedByName: session.user.name,
        description: `Chat was deleted by ${session.user.name}`
      });

      return NextResponse.json<IChatApiResponse>({
        success: true,
        message: 'Chat deleted successfully'
      });
    } else {
      // Leave chat - remove user as participant
      chat.removeParticipant(session.user.id);
      await chat.save();

      // Create activity log
      await ChatActivity.createActivity({
        chatId: new mongoose.Types.ObjectId(params.id),
        activityType: 'participant-left',
        performedBy: new mongoose.Types.ObjectId(session.user.id),
        performedByName: session.user.name,
        description: `${session.user.name} left the chat`
      });

      return NextResponse.json<IChatApiResponse>({
        success: true,
        message: 'Left chat successfully'
      });
    }

  } catch (error) {
    console.error('Delete/Leave chat error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to process request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}