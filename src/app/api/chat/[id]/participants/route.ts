// app/api/chat/[id]/participants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { 
  Chat, 
  ChatParticipant, 
  ChatActivity,
  IChatDocument, 
  IChatParticipantDocument 
} from '@/models/Chat';
import User from '@/models/User';
import { 
  IParticipantAddRequest,
  IChatApiResponse, 
  IChatParticipant,
  ParticipantRole,
  ChatPermission
} from '@/types/chat';
import { authOptions } from '@/lib/auth';

// Helper function to get default permissions based on role
function getDefaultPermissions(role: ParticipantRole): ChatPermission[] {
  switch (role) {
    case 'owner':
    case 'admin':
      return [
        'send-messages', 'send-files', 'create-polls', 'pin-messages',
        'delete-messages', 'edit-messages', 'mention-all', 'add-members',
        'remove-members', 'manage-chat', 'create-announcements'
      ] as ChatPermission[];
    case 'moderator':
      return [
        'send-messages', 'send-files', 'create-polls', 'pin-messages',
        'delete-messages', 'edit-messages', 'mention-all', 'create-announcements'
      ] as ChatPermission[];
    case 'member':
      return ['send-messages', 'send-files'] as ChatPermission[];
    case 'guest':
      return ['send-messages'] as ChatPermission[];
    default:
      return ['send-messages'] as ChatPermission[];
  }
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

// GET - List chat participants
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
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build filter
    const filter: any = { chatId };
    if (!includeInactive) {
      filter.isActive = true;
    }

    const participants = await ChatParticipant.find(filter)
      .populate('userId', 'name email mobile')
      .sort({ joinedAt: 1 });

    const convertedParticipants: IChatParticipant[] = participants.map(p => ({
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

    return NextResponse.json<IChatApiResponse<IChatParticipant[]>>({
      success: true,
      message: 'Participants retrieved successfully',
      data: convertedParticipants
    });

  } catch (error) {
    console.error('Get participants error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to retrieve participants',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Add participants to chat
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

    // Check if user can add members
    const canAddMembers = await hasPermission(chatId, session.user.id, 'add-members');
    if (!canAddMembers) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Insufficient permissions to add members to this chat'
      }, { status: 403 });
    }

    const chat = await Chat.findById(chatId) as IChatDocument | null;
    if (!chat) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    const body: IParticipantAddRequest = await request.json();
    const { userIds, role = 'member' } = body;

    if (!userIds || userIds.length === 0) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'User IDs are required'
      }, { status: 400 });
    }

    // Validate users exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Some users not found'
      }, { status: 400 });
    }

    // Check for existing participants
    const existingParticipants = await ChatParticipant.find({
      chatId,
      userId: { $in: userIds },
      isActive: true
    });

    const existingUserIds = existingParticipants.map(p => p.userId.toString());
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'All users are already participants in this chat'
      }, { status: 400 });
    }

    // Create new participants
    const newParticipants = [];
    for (const userId of newUserIds) {
      const user = users.find(u => u._id.toString() === userId);
      if (user) {
        const participant = await ChatParticipant.create({
          chatId,
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          role,
          permissions: getDefaultPermissions(role)
        });
        newParticipants.push(participant);
      }
    }

    // Update chat participants array
    const participantIds = newParticipants.map(p => p._id as any);
    await Chat.findByIdAndUpdate(chatId, {
      $push: { participants: { $each: participantIds } }
    });

    // Create activity logs
    for (const participant of newParticipants) {
      await ChatActivity.create({
        chatId,
        activityType: 'member-added',
        performedBy: session.user.id,
        performedByName: session.user.name,
        targetUserId: participant.userId.toString(),
        targetUserName: participant.userName,
        description: `${participant.userName} was added to the chat`
      });
    }

    // Update last activity
    await chat.updateLastActivity();

    const convertedParticipants: IChatParticipant[] = newParticipants.map(p => ({
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

    return NextResponse.json<IChatApiResponse<IChatParticipant[]>>({
      success: true,
      message: `${newParticipants.length} participants added successfully`,
      data: convertedParticipants
    }, { status: 201 });

  } catch (error) {
    console.error('Add participants error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to add participants',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}