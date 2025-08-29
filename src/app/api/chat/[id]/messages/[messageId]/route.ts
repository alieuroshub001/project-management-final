// app/api/chat/[id]/messages/[messageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/chat/Chat';
import Message from '@/models/chat/Message';
import User from '@/models/User';
import { 
  IMessageUpdateRequest,
  IChatApiResponse, 
  IMessage
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

// GET - Get single message with details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; messageId: string }> }
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

    // Check chat access
    const chat = await Chat.findById(params.id);
    if (!chat || !chat.isParticipant(session.user.id)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    const message = await Message.findById(params.messageId);
    if (!message || message.chatId.toString() !== params.id) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Message not found'
      }, { status: 404 });
    }

    // Mark as read
    if (!message.isReadBy(session.user.id)) {
      message.markAsRead(session.user.id, session.user.name);
      await message.save();
    }

    return NextResponse.json<IChatApiResponse<IMessage>>({
      success: true,
      message: 'Message retrieved successfully',
      data: convertToIMessage(message)
    });

  } catch (error) {
    console.error('Get message error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to retrieve message',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update message
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; messageId: string }> }
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

    // Check chat access
    const chat = await Chat.findById(params.id);
    if (!chat || !chat.isParticipant(session.user.id)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    const message = await Message.findById(params.messageId);
    if (!message || message.chatId.toString() !== params.id) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Message not found'
      }, { status: 404 });
    }

    // Check if user can edit
    if (!message.canEdit(session.user.id)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'You can only edit your own messages within 24 hours'
      }, { status: 403 });
    }

    const body: IMessageUpdateRequest = await request.json();
    const {
      content,
      cloudinaryAttachments,
      mentions,
      filesToDelete
    } = body;

    // Store previous content for edit history
    const previousContent = message.content;

    // Update content
    if (content !== undefined) {
      message.content = content;
    }

    // Handle attachments
    if (cloudinaryAttachments) {
      const newAttachments = cloudinaryAttachments.map(file => ({
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
      message.attachments = [...(message.attachments || []), ...newAttachments];
    }

    // Handle file deletion
    if (filesToDelete && filesToDelete.length > 0) {
      message.attachments = (message.attachments || []).filter(
        (att: any) => !filesToDelete.includes(att.file.public_id)
      );
    }

    // Update mentions
    if (mentions) {
      const mentionedUsers = await User.find({ _id: { $in: mentions } }).lean();
      message.mentions = mentionedUsers.map((user: any, index: number) => ({
        id: `mention_${index}`,
        mentionedUserId: new mongoose.Types.ObjectId(user._id),
        mentionedUserName: user.name,
        mentionedUserEmail: user.email,
        mentionType: 'user',
        startIndex: 0, // These would need to be calculated based on content
        endIndex: 0,
        isRead: false
      }));
    }

    // Add to edit history
    message.addToEditHistory(previousContent, session.user.id, session.user.name);

    await message.save();

    return NextResponse.json<IChatApiResponse<IMessage>>({
      success: true,
      message: 'Message updated successfully',
      data: convertToIMessage(message)
    });

  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to update message',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete message
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; messageId: string }> }
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

    // Check chat access
    const chat = await Chat.findById(params.id);
    if (!chat || !chat.isParticipant(session.user.id)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    const message = await Message.findById(params.messageId);
    if (!message || message.chatId.toString() !== params.id) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Message not found'
      }, { status: 404 });
    }

    // Check if user can delete
    if (!message.canDelete(session.user.id)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'You can only delete your own messages'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const deleteFor = searchParams.get('deleteFor') || 'sender'; // 'sender' or 'everyone'

    // Soft delete message
    message.softDelete(session.user.id, deleteFor);
    await message.save();

    return NextResponse.json<IChatApiResponse>({
      success: true,
      message: `Message deleted ${deleteFor === 'everyone' ? 'for everyone' : 'for you'}`
    });

  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to delete message',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}