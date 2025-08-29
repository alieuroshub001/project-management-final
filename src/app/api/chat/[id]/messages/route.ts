// app/api/chat/[id]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/chat/Chat';
import Message from '@/models/chat/Message';
import User from '@/models/User';
import { 
  IMessageSendRequest,
  IChatApiResponse, 
  IMessage,
  IMessageListResponse
} from '@/types/chat';
import { authOptions } from '@/lib/auth';

// Helper function to convert Mongoose document to IMessage
function convertToIMessage(doc: any): IMessage {
  return {
    id: doc._id.toString(),
    chatId: doc.chatId.toString(),
    senderId: doc.senderId.toString(),
    senderName: doc.senderName,
    senderEmail: doc.senderEmail,
    senderProfileImage: doc.senderProfileImage,
    content: doc.content,
    messageType: doc.messageType,
    attachments: doc.attachments?.map((att: any) => ({
      id: att.id,
      messageId: doc._id.toString(),
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
    replyTo: doc.replyTo,
    forwardedFrom: doc.forwardedFrom,
    reactions: doc.reactions?.map((r: any) => ({
      id: r.id,
      messageId: doc._id.toString(),
      userId: r.userId.toString(),
      userName: r.userName,
      emoji: r.emoji,
      createdAt: r.createdAt
    })),
    mentions: doc.mentions?.map((m: any) => ({
      id: m.id,
      messageId: doc._id.toString(),
      mentionedUserId: m.mentionedUserId.toString(),
      mentionedUserName: m.mentionedUserName,
      mentionedUserEmail: m.mentionedUserEmail,
      mentionType: m.mentionType,
      startIndex: m.startIndex,
      endIndex: m.endIndex,
      isRead: m.isRead,
      readAt: m.readAt
    })),
    isPinned: doc.isPinned,
    pinnedBy: doc.pinnedBy,
    pinnedAt: doc.pinnedAt,
    pinnedReason: doc.pinnedReason,
    isEdited: doc.isEdited,
    editedAt: doc.editedAt,
    editHistory: doc.editHistory,
    isDeleted: doc.isDeleted,
    deletedAt: doc.deletedAt,
    deletedBy: doc.deletedBy,
    deletedFor: doc.deletedFor,
    deliveryStatus: doc.deliveryStatus,
    readBy: doc.readBy?.map((r: any) => ({
      messageId: doc._id.toString(),
      userId: r.userId.toString(),
      userName: r.userName,
      readAt: r.readAt
    })),
    threadId: doc.threadId,
    threadRepliesCount: doc.threadRepliesCount,
    lastThreadReply: doc.lastThreadReply,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// Check if user has access to chat
async function hasChatAccess(chatId: string, userId: string): Promise<boolean> {
  const chat = await Chat.findById(chatId);
  return chat ? chat.isParticipant(userId) : false;
}

// GET - Get messages for a chat
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

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Message ID to load messages before
    const after = searchParams.get('after'); // Message ID to load messages after
    const threadId = searchParams.get('threadId'); // Get thread replies

    let query: any = {
      chatId: params.id,
      isDeleted: false
    };

    // Handle thread messages
    if (threadId) {
      query.threadId = threadId;
    }

    // Handle pagination with cursor-based approach
    if (before) {
      const beforeMessage = await Message.findById(before);
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    if (after) {
      const afterMessage = await Message.findById(after);
      if (afterMessage) {
        query.createdAt = { $gt: afterMessage.createdAt };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: after ? 1 : -1 })
      .limit(limit)
      .populate('senderId', 'name email profileImage');

    // If loading newer messages (after), reverse the order
    if (after) {
      messages.reverse();
    }

    // Check if there are more messages
    const totalMessages = await Message.countDocuments({
      chatId: params.id,
      isDeleted: false
    });

    const hasMore = messages.length === limit;
    const hasOlder = !after && messages.length > 0 ? 
      await Message.countDocuments({
        chatId: params.id,
        isDeleted: false,
        createdAt: { $lt: messages[messages.length - 1].createdAt }
      }) > 0 : false;

    const response: IMessageListResponse = {
      messages: messages.map(convertToIMessage),
      totalCount: totalMessages,
      hasMore,
      hasOlder
    };

    return NextResponse.json<IChatApiResponse<IMessageListResponse>>({
      success: true,
      message: 'Messages retrieved successfully',
      data: response
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to retrieve messages',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Send new message
export async function POST(
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
    const chat = await Chat.findById(params.id);
    if (!chat || !chat.isParticipant(session.user.id)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    // Check if user can send messages
    if (!chat.canUserPerformAction(session.user.id, 'send-messages')) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'You do not have permission to send messages in this chat'
      }, { status: 403 });
    }

    const body: IMessageSendRequest = await request.json();
    const {
      content,
      messageType = 'text',
      cloudinaryAttachments,
      replyToMessageId,
      mentions,
      scheduledFor
    } = body;

    // Validate content
    if (!content && (!cloudinaryAttachments || cloudinaryAttachments.length === 0)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Message content or attachments required'
      }, { status: 400 });
    }

    // Get sender profile info
    const sender = await User.findById(session.user.id).lean();
    if (!sender) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Process reply if provided
    let replyTo;
    if (replyToMessageId) {
      const originalMessage = await Message.findById(replyToMessageId);
      if (originalMessage) {
        replyTo = {
          messageId: (originalMessage._id as mongoose.Types.ObjectId).toString(),
          content: originalMessage.content.slice(0, 200),
          senderId: originalMessage.senderId.toString(),
          senderName: originalMessage.senderName,
          timestamp: originalMessage.createdAt,
          attachmentCount: originalMessage.attachments?.length || 0
        };
      }
    }

    // Process mentions
    let processedMentions;
    if (mentions && mentions.length > 0) {
      const mentionedUsers = await User.find({ _id: { $in: mentions } }).lean();
      processedMentions = mentionedUsers.map((user, index) => ({
        id: user._id.toString(),
        mentionedUserId: new mongoose.Types.ObjectId(user._id),
        mentionedUserName: user.name,
        mentionedUserEmail: user.email,
        mentionType: 'user',
        startIndex: 0, // These would need to be calculated based on content
        endIndex: 0,
        isRead: false
      }));
    }

    // Process attachments
    let processedAttachments;
    if (cloudinaryAttachments && cloudinaryAttachments.length > 0) {
      processedAttachments = cloudinaryAttachments.map(file => ({
        id: file.public_id,
        file,
        fileName: file.original_filename,
        fileSize: file.bytes,
        mimeType: file.format,
        downloadCount: 0,
        uploadedBy: session.user.id,
        uploadedByName: session.user.name,
        createdAt: new Date()
      }));
    }

    const messageData = {
      chatId: params.id,
      senderId: session.user.id,
      senderName: session.user.name,
      senderEmail: session.user.email,
      content: content || '',
      messageType,
      attachments: processedAttachments,
      replyTo,
      mentions: processedMentions,
      reactions: [],
      isPinned: false,
      isEdited: false,
      isDeleted: false,
      deletedFor: 'none',
      deliveryStatus: 'sent',
      readBy: [{
        userId: session.user.id,
        userName: session.user.name,
        readAt: new Date()
      }],
      threadRepliesCount: 0,
      metadata: scheduledFor ? { scheduledFor } : undefined
    };

    const message = await Message.create(messageData);

    // Update chat's last activity and message count
    chat.updateLastActivity();
    chat.incrementUnreadCount();
    chat.lastMessageId = message._id as mongoose.Types.ObjectId;
    await chat.save();

    // Mark as read for sender
    message.markAsRead(session.user.id, session.user.name);
    await message.save();

    return NextResponse.json<IChatApiResponse<IMessage>>({
      success: true,
      message: 'Message sent successfully',
      data: convertToIMessage(message)
    }, { status: 201 });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to send message',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}