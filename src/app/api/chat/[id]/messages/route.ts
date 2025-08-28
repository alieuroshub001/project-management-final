// app/api/chat/[id]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { 
  Chat, 
  ChatParticipant, 
  Message, 
  MessageAttachment,
  IChatDocument, 
  IMessageDocument 
} from '@/models/Chat';
import { 
  IMessageSendRequest,
  IChatApiResponse, 
  IMessage,
  MessageType,
  ChatPermission
} from '@/types/chat';
import { authOptions } from '@/lib/auth';

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

// Convert message document to IMessage
function convertToIMessage(doc: IMessageDocument): IMessage {
  return {
    id: (doc._id as any).toString(),
    chatId: doc.chatId.toString(),
    senderId: doc.senderId.toString(),
    senderName: doc.senderName,
    senderEmail: doc.senderEmail,
    senderAvatar: doc.senderAvatar,
    content: doc.content,
    messageType: doc.messageType as MessageType,
    replyToMessageId: doc.replyToMessageId?.toString(),
    mentions: doc.mentions,
    attachments: [], // Will be populated separately if needed
    reactions: doc.reactions.map(r => ({
      id: r.id,
      messageId: (doc._id as any).toString(),
      userId: r.userId,
      userName: r.userName,
      emoji: r.emoji,
      createdAt: r.createdAt
    })),
    isEdited: doc.isEdited,
    editedAt: doc.editedAt,
    isDeleted: doc.isDeleted,
    deletedAt: doc.deletedAt,
    deliveredTo: doc.deliveredTo.map(d => ({
      userId: d.userId,
      deliveredAt: d.deliveredAt
    })),
    readBy: doc.readBy.map(r => ({
      userId: r.userId,
      readAt: r.readAt
    })),
    isPinned: doc.isPinned,
    pinnedBy: doc.pinnedBy?.toString(),
    pinnedAt: doc.pinnedAt,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// GET - List messages in chat
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Message ID to get messages before
    const after = searchParams.get('after'); // Message ID to get messages after
    const search = searchParams.get('search'); // Search query

    // Build filter
    const filter: any = { 
      chatId, 
      isDeleted: false 
    };

    if (before) {
      const beforeMessage = await Message.findById(before);
      if (beforeMessage) {
        filter.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    if (after) {
      const afterMessage = await Message.findById(after);
      if (afterMessage) {
        filter.createdAt = { $gt: afterMessage.createdAt };
      }
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Execute query
    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: before ? -1 : 1 }) // Descending for "before", ascending for "after"
        .skip(skip)
        .limit(limit)
        .populate('replyToMessageId')
        .lean() as Promise<IMessageDocument[]>,
      Message.countDocuments(filter)
    ]);

    // If getting messages before a certain point, reverse to show newest first
    if (before) {
      messages.reverse();
    }

    // Convert messages and populate attachments
    const convertedMessages = await Promise.all(
      messages.map(async (msg) => {
        const message = convertToIMessage(msg);
        
        // Get attachments
        if (msg.attachments && msg.attachments.length > 0) {
          const attachments = await MessageAttachment.find({
            _id: { $in: msg.attachments }
          });
          
          message.attachments = attachments.map(att => ({
            id: (att._id as any).toString(),
            messageId: att.messageId.toString(),
            file: att.file,
            fileType: att.fileType as any,
            fileName: att.fileName,
            fileSize: att.fileSize,
            description: att.description,
            uploadedBy: att.uploadedBy.toString(),
            uploadedAt: att.uploadedAt
          }));
        }
        
        return message;
      })
    );

    // Mark messages as delivered for current user
    const messageIds = messages.map(m => m._id);
    await Message.updateMany(
      { 
        _id: { $in: messageIds },
        senderId: { $ne: session.user.id },
        'deliveredTo.userId': { $ne: session.user.id }
      },
      { 
        $push: { 
          deliveredTo: {
            userId: session.user.id,
            deliveredAt: new Date()
          }
        }
      }
    );

    return NextResponse.json<IChatApiResponse<{
      messages: IMessage[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>>({
      success: true,
      message: 'Messages retrieved successfully',
      data: {
        messages: convertedMessages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + messages.length < total
        }
      }
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
    const chatId = params.id;

    // Check if user can send messages
    const canSendMessages = await hasPermission(chatId, session.user.id, 'send-messages');
    if (!canSendMessages) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Insufficient permissions to send messages'
      }, { status: 403 });
    }

    // Check if user is muted
    const participant = await ChatParticipant.findOne({
      chatId,
      userId: session.user.id,
      isActive: true
    });

    if (participant?.isMuted) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'You are muted in this chat'
      }, { status: 403 });
    }

    const chat = await Chat.findById(chatId) as IChatDocument | null;
    if (!chat) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    const body: IMessageSendRequest = await request.json();
    const {
      content,
      messageType = 'text',
      replyToMessageId,
      mentions = [],
      cloudinaryAttachments = []
    } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Message content is required'
      }, { status: 400 });
    }

    if (content.length > 4000) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Message content exceeds maximum length of 4000 characters'
      }, { status: 400 });
    }

    // Validate reply-to message
    if (replyToMessageId) {
      const replyToMessage = await Message.findOne({
        _id: replyToMessageId,
        chatId,
        isDeleted: false
      });
      
      if (!replyToMessage) {
        return NextResponse.json<IChatApiResponse>({
          success: false,
          message: 'Reply-to message not found'
        }, { status: 400 });
      }
    }

    // Create message
    const messageData = {
      chatId,
      senderId: session.user.id,
      senderName: session.user.name,
      senderEmail: session.user.email,
      content: content.trim(),
      messageType,
      replyToMessageId: replyToMessageId || undefined,
      mentions,
      attachments: []
    };

    const message = await Message.create(messageData) as IMessageDocument;

    // Handle attachments
    if (cloudinaryAttachments.length > 0) {
      const attachmentPromises = cloudinaryAttachments.map(file =>
        MessageAttachment.create({
          messageId: message._id,
          file,
          fileType: file.resource_type === 'image' ? 'image' : 
                   file.resource_type === 'video' ? 'video' :
                   file.resource_type === 'raw' ? 'document' : 'other',
          fileName: file.original_filename,
          fileSize: file.bytes,
          uploadedBy: session.user.id
        })
      );

      const attachments = await Promise.all(attachmentPromises);
      message.attachments = attachments.map(att => att._id as any);
      await message.save();
    }

    // Update chat last message and activity
    chat.lastMessageId = message._id as any;
    await chat.updateLastActivity();

    // Mark as delivered to sender
    message.markAsDelivered(session.user.id);
    await message.save();

    const convertedMessage = convertToIMessage(message);
    
    // Populate attachments if any
    if (message.attachments.length > 0) {
      const attachments = await MessageAttachment.find({
        _id: { $in: message.attachments }
      });
      
      convertedMessage.attachments = attachments.map(att => ({
        id: (att._id as any).toString(),
        messageId: att.messageId.toString(),
        file: att.file,
        fileType: att.fileType as any,
        fileName: att.fileName,
        fileSize: att.fileSize,
        description: att.description,
        uploadedBy: att.uploadedBy.toString(),
        uploadedAt: att.uploadedAt
      }));
    }

    return NextResponse.json<IChatApiResponse<IMessage>>({
      success: true,
      message: 'Message sent successfully',
      data: convertedMessage
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