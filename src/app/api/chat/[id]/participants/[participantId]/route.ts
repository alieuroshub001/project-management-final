// app/api/chat/[id]/participants/[participantId]/route.ts
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
import { 
  IParticipantUpdateRequest,
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

// GET - Get single participant
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; participantId: string }> }
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
    const participantId = params.participantId;

    // Check access
    const hasAccess = await hasChatAccess(chatId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    const participant = await ChatParticipant.findOne({
      _id: participantId,
      chatId
    }).populate('userId', 'name email mobile') as IChatParticipantDocument | null;

    if (!participant) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Participant not found'
      }, { status: 404 });
    }

    const convertedParticipant: IChatParticipant = {
      id: (participant._id as any).toString(),
      chatId: participant.chatId.toString(),
      userId: participant.userId.toString(),
      userName: participant.userName,
      userEmail: participant.userEmail,
      userAvatar: participant.userAvatar,
      role: participant.role as ParticipantRole,
      joinedAt: participant.joinedAt,
      leftAt: participant.leftAt,
      isActive: participant.isActive,
      isMuted: participant.isMuted,
      lastReadMessageId: participant.lastReadMessageId?.toString(),
      lastReadAt: participant.lastReadAt,
      permissions: participant.permissions as ChatPermission[]
    };

    return NextResponse.json<IChatApiResponse<IChatParticipant>>({
      success: true,
      message: 'Participant retrieved successfully',
      data: convertedParticipant
    });

  } catch (error) {
    console.error('Get participant error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to retrieve participant',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update participant
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; participantId: string }> }
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
    const participantId = params.participantId;

    // Check if user can manage members or is updating themselves
    const participant = await ChatParticipant.findOne({
      _id: participantId,
      chatId
    }) as IChatParticipantDocument | null;

    if (!participant) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Participant not found'
      }, { status: 404 });
    }

    const body: IParticipantUpdateRequest = await request.json();
    const { role, permissions, isMuted } = body;

    // Check permissions for different updates
    const isUpdatingSelf = participant.userId.toString() === session.user.id;
    const canManageMembers = await hasPermission(chatId, session.user.id, 'remove-members');
    
    // Role changes require admin permissions
    if (role !== undefined && !canManageMembers) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Insufficient permissions to change participant roles'
      }, { status: 403 });
    }

    // Permission changes require admin permissions
    if (permissions !== undefined && !canManageMembers) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Insufficient permissions to change participant permissions'
      }, { status: 403 });
    }

    // Muting can be done by self or admins
    if (isMuted !== undefined && !isUpdatingSelf && !canManageMembers) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Insufficient permissions to mute/unmute participants'
      }, { status: 403 });
    }

    // Prevent owner role changes
    if (role !== undefined && participant.role === 'owner') {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Cannot change owner role'
      }, { status: 400 });
    }

    // Build update object
    const updateData: any = {};
    if (role !== undefined) {
      updateData.role = role;
      // Update permissions based on new role if not explicitly provided
      if (permissions === undefined) {
        updateData.permissions = getDefaultPermissions(role);
      }
    }
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isMuted !== undefined) updateData.isMuted = isMuted;

    const updatedParticipant = await ChatParticipant.findByIdAndUpdate(
      participantId,
      updateData,
      { new: true }
    ) as IChatParticipantDocument | null;

    if (!updatedParticipant) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Failed to update participant'
      }, { status: 500 });
    }

    // Create activity logs
    if (role !== undefined && role !== participant.role) {
      const activityType = role === 'admin' || role === 'moderator' ? 'member-promoted' : 'member-demoted';
      await ChatActivity.create({
        chatId,
        activityType,
        performedBy: session.user.id,
        performedByName: session.user.name,
        targetUserId: participant.userId.toString(),
        targetUserName: participant.userName,
        description: `${participant.userName} role changed from ${participant.role} to ${role}`
      });
    }

    if (isMuted !== undefined && isMuted !== participant.isMuted) {
      const activityType = isMuted ? 'member-muted' : 'member-unmuted';
      await ChatActivity.create({
        chatId,
        activityType,
        performedBy: session.user.id,
        performedByName: session.user.name,
        targetUserId: participant.userId.toString(),
        targetUserName: participant.userName,
        description: `${participant.userName} was ${isMuted ? 'muted' : 'unmuted'}`
      });
    }

    // Update chat last activity
    const chat = await Chat.findById(chatId);
    if (chat) await chat.updateLastActivity();

    const convertedParticipant: IChatParticipant = {
      id: (updatedParticipant._id as any).toString(),
      chatId: updatedParticipant.chatId.toString(),
      userId: updatedParticipant.userId.toString(),
      userName: updatedParticipant.userName,
      userEmail: updatedParticipant.userEmail,
      userAvatar: updatedParticipant.userAvatar,
      role: updatedParticipant.role as ParticipantRole,
      joinedAt: updatedParticipant.joinedAt,
      leftAt: updatedParticipant.leftAt,
      isActive: updatedParticipant.isActive,
      isMuted: updatedParticipant.isMuted,
      lastReadMessageId: updatedParticipant.lastReadMessageId?.toString(),
      lastReadAt: updatedParticipant.lastReadAt,
      permissions: updatedParticipant.permissions as ChatPermission[]
    };

    return NextResponse.json<IChatApiResponse<IChatParticipant>>({
      success: true,
      message: 'Participant updated successfully',
      data: convertedParticipant
    });

  } catch (error) {
    console.error('Update participant error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to update participant',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Remove participant from chat
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; participantId: string }> }
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
    const participantId = params.participantId;

    const participant = await ChatParticipant.findOne({
      _id: participantId,
      chatId
    }) as IChatParticipantDocument | null;

    if (!participant) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Participant not found'
      }, { status: 404 });
    }

    // Check permissions
    const isRemovingSelf = participant.userId.toString() === session.user.id;
    const canRemoveMembers = await hasPermission(chatId, session.user.id, 'remove-members');

    if (!isRemovingSelf && !canRemoveMembers) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Insufficient permissions to remove participants'
      }, { status: 403 });
    }

    // Prevent owner removal
    if (participant.role === 'owner') {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Cannot remove chat owner'
      }, { status: 400 });
    }

    // Soft delete - mark as inactive
    const removedParticipant = await ChatParticipant.findByIdAndUpdate(
      participantId,
      { 
        isActive: false, 
        leftAt: new Date() 
      },
      { new: true }
    ) as IChatParticipantDocument | null;

    if (!removedParticipant) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Failed to remove participant'
      }, { status: 500 });
    }

    // Remove from chat participants array
    await Chat.findByIdAndUpdate(chatId, {
      $pull: { participants: participantId }
    });

    // Create activity log
    const activityDescription = isRemovingSelf 
      ? `${participant.userName} left the chat`
      : `${participant.userName} was removed from the chat`;

    await ChatActivity.create({
      chatId,
      activityType: 'member-removed',
      performedBy: session.user.id,
      performedByName: session.user.name,
      targetUserId: participant.userId.toString(),
      targetUserName: participant.userName,
      description: activityDescription
    });

    // Update chat last activity
    const chat = await Chat.findById(chatId);
    if (chat) await chat.updateLastActivity();

    return NextResponse.json<IChatApiResponse>({
      success: true,
      message: isRemovingSelf ? 'Left chat successfully' : 'Participant removed successfully'
    });

  } catch (error) {
    console.error('Remove participant error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to remove participant',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}