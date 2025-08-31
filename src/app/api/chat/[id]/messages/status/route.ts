// app/api/chat/[id]/messages/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/chat/Chat';
import Message from '@/models/chat/Message';
import { IChatApiResponse, MessageStatus } from '@/types/chat';

interface UpdateStatusRequest {
  messageIds: string[];
  status: MessageStatus;
}

// PUT - Update message status (delivered/read)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const chatId = params.id;
    const body: UpdateStatusRequest = await request.json();
    const { messageIds, status } = body;

    // Validate request
    if (!messageIds || messageIds.length === 0 || !status) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Message IDs and status are required'
      }, { status: 400 });
    }

    // Check if user is participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(session.user.id)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    const updateData: any = {};
    
    if (status === 'delivered') {
      updateData.deliveryStatus = 'delivered';
    } else if (status === 'read') {
      updateData.deliveryStatus = 'read';
      updateData.$addToSet = {
        readBy: {
          userId: session.user.id,
          userName: session.user.name,
          readAt: new Date()
        }
      };
    }

    // Update messages
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        chatId: chatId,
        senderId: { $ne: session.user.id }, // Don't update own messages
        readBy: { $not: { $elemMatch: { userId: session.user.id } } } // Only if not already read
      },
      updateData
    );

    // If marking as read, update chat participant unread count
    if (status === 'read') {
      await Chat.findByIdAndUpdate(chatId, {
        $set: {
          'participants.$[elem].unreadCount': 0,
          'participants.$[elem].lastSeenAt': new Date()
        }
      }, {
        arrayFilters: [{ 'elem.userId': session.user.id }]
      });
    }

    return NextResponse.json<IChatApiResponse>({
      success: true,
      message: `Messages marked as ${status}`,
      data: { updatedCount: result.modifiedCount }
    });

  } catch (error) {
    console.error('Update message status error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to update message status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get message status for specific messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const chatId = params.id;
    const { searchParams } = new URL(request.url);
    const messageIds = searchParams.get('messageIds')?.split(',') || [];

    if (messageIds.length === 0) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Message IDs are required'
      }, { status: 400 });
    }

    // Check if user is participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(session.user.id)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    // Get message status
    const messages = await Message.find({
      _id: { $in: messageIds },
      chatId: chatId
    }).select('_id deliveryStatus readBy createdAt').lean();

    const messageStatus = messages.map(msg => {
      const readCount = msg.readBy?.length || 0;
      const totalParticipants = chat.participants.filter(p => p.isActive && p.userId.toString() !== msg.senderId?.toString()).length;
      
      let status: MessageStatus = 'sent';
      if (readCount > 0) {
        status = readCount === totalParticipants ? 'read' : 'delivered';
      } else if (msg.deliveryStatus === 'delivered') {
        status = 'delivered';
      }

      return {
        messageId: msg._id.toString(),
        status,
        readBy: msg.readBy || [],
        readCount,
        totalParticipants
      };
    });

    return NextResponse.json<IChatApiResponse>({
      success: true,
      message: 'Message status retrieved',
      data: messageStatus
    });

  } catch (error) {
    console.error('Get message status error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to get message status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}