// app/api/chat/[id]/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { 
  Chat, 
  ChatParticipant, 
  Message, 
  Announcement,
  MessageAttachment,
  IChatDocument, 
  IAnnouncementDocument 
} from '@/models/Chat';
import { 
  IAnnouncementCreateRequest,
  IChatApiResponse, 
  IAnnouncement,
  AnnouncementPriority,
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

// GET - List announcements in chat
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const priority = searchParams.get('priority') as AnnouncementPriority;
    const isActive = searchParams.get('isActive');
    const isPinned = searchParams.get('isPinned');
    const includeExpired = searchParams.get('includeExpired') === 'true';

    // Build filter
    const filter: any = { chatId };
    
    if (priority) filter.priority = priority;
    if (isActive !== null) filter.isActive = isActive === 'true';
    if (isPinned !== null) filter.isPinned = isPinned === 'true';
    
    if (!includeExpired) {
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ];
    }

    // Only show announcements targeted at current user
    filter.$or = [
      { targetAudience: { $in: [session.user.id] } },
      { targetAudience: { $size: 0 } }, // Empty array means all members
      { targetAudience: { $exists: false } }
    ];

    // Execute query
    const skip = (page - 1) * limit;
    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .sort({ isPinned: -1, priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as any as Promise<IAnnouncementDocument[]>,
      Announcement.countDocuments(filter)
    ]);

    // Convert announcements and populate attachments
    const convertedAnnouncements = await Promise.all(
      announcements.map(async (announcement) => {
        const convertedAnnouncement = convertToIAnnouncement(announcement);
        
        // Get attachments
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
        
        return convertedAnnouncement;
      })
    );

    return NextResponse.json<IChatApiResponse<{
      announcements: IAnnouncement[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>>({
      success: true,
      message: 'Announcements retrieved successfully',
      data: {
        announcements: convertedAnnouncements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get announcements error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to retrieve announcements',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new announcement
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

    // Check if user can create announcements
    const canCreateAnnouncements = await hasPermission(chatId, session.user.id, 'create-announcements');
    if (!canCreateAnnouncements) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Insufficient permissions to create announcements'
      }, { status: 403 });
    }

    const chat = await Chat.findById(chatId) as IChatDocument | null;
    if (!chat) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    // Check if announcements are enabled for this chat
    if (!chat.settings.allowAnnouncements) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Announcements are not enabled for this chat'
      }, { status: 403 });
    }

    const body: IAnnouncementCreateRequest = await request.json();
    const {
      title,
      content,
      priority = 'normal',
      targetAudience = [],
      cloudinaryAttachments = [],
      expiresIn,
      isPinned = false
    } = body;

    // Validate input
    if (!title || title.trim().length === 0) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Announcement title is required'
      }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Announcement content is required'
      }, { status: 400 });
    }

    if (title.length > 200) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Announcement title cannot exceed 200 characters'
      }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Announcement content cannot exceed 2000 characters'
      }, { status: 400 });
    }

    // Validate target audience if specified
    if (targetAudience.length > 0) {
      const participants = await ChatParticipant.find({
        chatId,
        userId: { $in: targetAudience },
        isActive: true
      });

      if (participants.length !== targetAudience.length) {
        return NextResponse.json<IChatApiResponse>({
          success: false,
          message: 'Some target audience members are not active participants'
        }, { status: 400 });
      }
    }

    // Calculate expiration date
    let expiresAt: Date | undefined;
    if (expiresIn && expiresIn > 0) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresIn);
    }

    // First create an announcement message
    const announcementMessage = await Message.create({
      chatId,
      senderId: session.user.id,
      senderName: session.user.name,
      senderEmail: session.user.email,
      content: `📢 ${title}\n\n${content}`,
      messageType: 'announcement'
    });

    // Handle attachments
    const attachmentIds = [];
    if (cloudinaryAttachments.length > 0) {
      const attachmentPromises = cloudinaryAttachments.map(file =>
        MessageAttachment.create({
          messageId: announcementMessage._id,
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
      attachmentIds.push(...attachments.map(att => att._id));
    }

    // Create the announcement
    const announcementData = {
      messageId: announcementMessage._id,
      chatId,
      createdBy: session.user.id,
      createdByName: session.user.name,
      title: title.trim(),
      content: content.trim(),
      priority,
      targetAudience,
      attachments: attachmentIds,
      acknowledgments: [],
      expiresAt,
      isActive: true,
      isPinned
    };

    const announcement = await Announcement.create(announcementData) as IAnnouncementDocument;

    // Update the message with announcement metadata
    announcementMessage.metadata = { announcementId: (announcement._id as any).toString() };
    if (isPinned) {
      announcementMessage.isPinned = true;
      announcementMessage.pinnedBy = session.user.id as any;
      announcementMessage.pinnedAt = new Date();
    }
    await announcementMessage.save();

    // Update chat last message and activity
    chat.lastMessageId = announcementMessage._id as any;
    await chat.updateLastActivity();

    const convertedAnnouncement = convertToIAnnouncement(announcement);

    // Populate attachments
    if (attachmentIds.length > 0) {
      const attachments = await MessageAttachment.find({
        _id: { $in: attachmentIds }
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
      message: 'Announcement created successfully',
      data: convertedAnnouncement
    }, { status: 201 });

  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to create announcement',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}