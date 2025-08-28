// app/api/chat/[id]/announcements/[announcementId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { 
  Chat, 
  ChatParticipant, 
  Announcement,
  MessageAttachment,
  ChatActivity,
  IAnnouncementDocument 
} from '@/models/Chat';
import { 
  IChatApiResponse, 
  IAnnouncement,
  AnnouncementPriority,
  ChatPermission
} from '@/types/chat';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

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

// Convert announcement document to IAnnouncement
function convertToIAnnouncement(doc: IAnnouncementDocument): IAnnouncement {
  return {
    id: (doc._id as any).toString(),
    messageId: doc.messageId.toString(),
    chatId: doc.chatId.toString(),
    createdBy: doc.createdBy.toString(),
    createdByName: doc.createdByName,
    title: doc.title,
    content: doc.content,
    priority: doc.priority as AnnouncementPriority,
    targetAudience: doc.targetAudience,
    attachments: [], // Will be populated separately if needed
    acknowledgments: doc.acknowledgments.map(ack => ({
      id: ack.id,
      announcementId: (doc._id as any).toString(),
      userId: ack.userId,
      userName: ack.userName,
      acknowledgedAt: ack.acknowledgedAt
    })),
    expiresAt: doc.expiresAt,
    isActive: doc.isActive,
    isPinned: doc.isPinned,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// GET - Get single announcement
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; announcementId: string }> }
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
    const announcementId = params.announcementId;

    // Check access
    const hasAccess = await hasChatAccess(chatId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    const announcement = await Announcement.findOne({
      _id: announcementId,
      chatId
    }) as IAnnouncementDocument | null;

    if (!announcement) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Announcement not found'
      }, { status: 404 });
    }

    // Check if user is in target audience (if specified)
    if (announcement.targetAudience.length > 0 && 
        !announcement.targetAudience.includes(session.user.id)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'You are not in the target audience for this announcement'
      }, { status: 403 });
    }

    const convertedAnnouncement = convertToIAnnouncement(announcement);

    // Populate attachments
    if (announcement.attachments && announcement.attachments.length > 0) {
      const attachments = await MessageAttachment.find({
        _id: { $in: announcement.attachments }
      });
      
      convertedAnnouncement.attachments = attachments.map(att => ({
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

    return NextResponse.json<IChatApiResponse<IAnnouncement>>({
      success: true,
      message: 'Announcement retrieved successfully',
      data: convertedAnnouncement
    });

  } catch (error) {
    console.error('Get announcement error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to retrieve announcement',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Acknowledge announcement
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; announcementId: string }> }
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
    const announcementId = params.announcementId;

    // Check access
    const hasAccess = await hasChatAccess(chatId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    const announcement = await Announcement.findOne({
      _id: announcementId,
      chatId
    }) as IAnnouncementDocument | null;

    if (!announcement) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Announcement not found'
      }, { status: 404 });
    }

    // Check if user is in target audience (if specified)
    if (announcement.targetAudience.length > 0 && 
        !announcement.targetAudience.includes(session.user.id)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'You are not in the target audience for this announcement'
      }, { status: 403 });
    }

    // Check if already acknowledged
    const existingAck = announcement.acknowledgments.find(ack => ack.userId === session.user.id);
    if (existingAck) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'You have already acknowledged this announcement'
      }, { status: 400 });
    }

    // Add acknowledgment
    announcement.addAcknowledgment(session.user.id, session.user.name);
    await announcement.save();

    const convertedAnnouncement = convertToIAnnouncement(announcement);

    return NextResponse.json<IChatApiResponse<IAnnouncement>>({
      success: true,
      message: 'Announcement acknowledged successfully',
      data: convertedAnnouncement
    });

  } catch (error) {
    console.error('Acknowledge announcement error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to acknowledge announcement',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete/deactivate announcement (only creator or admin)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; announcementId: string }> }
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
    const announcementId = params.announcementId;

    const announcement = await Announcement.findOne({
      _id: announcementId,
      chatId
    }) as IAnnouncementDocument | null;

    if (!announcement) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Announcement not found'
      }, { status: 404 });
    }

    // Check if user can delete announcement (creator or admin)
    const canDeleteAnnouncement = announcement.createdBy.toString() === session.user.id ||
                                 await hasPermission(chatId, session.user.id, 'manage-chat');

    if (!canDeleteAnnouncement) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Insufficient permissions to delete this announcement'
      }, { status: 403 });
    }

    // Deactivate the announcement
    const deactivatedAnnouncement = await Announcement.findByIdAndUpdate(
      announcementId,
      { isActive: false },
      { new: true }
    ) as IAnnouncementDocument | null;

    if (!deactivatedAnnouncement) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Failed to delete announcement'
      }, { status: 500 });
    }

    // Create activity log
    await ChatActivity.create({
      chatId,
      activityType: 'announcement-created', // Using existing type, ideally would be 'announcement-deleted'
      performedBy: session.user.id,
      performedByName: session.user.name,
      description: `Announcement "${announcement.title}" was deleted`
    });

    // Update chat last activity
    const chat = await Chat.findById(chatId);
    if (chat) await chat.updateLastActivity();

    return NextResponse.json<IChatApiResponse>({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Delete announcement error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to delete announcement',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}