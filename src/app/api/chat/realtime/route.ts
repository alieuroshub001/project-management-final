// app/api/chat/realtime/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/chat/Chat';
import Message from '@/models/chat/Message';
import { IChatApiResponse, WebSocketMessage, ConnectionStatus } from '@/types/chat';

// Store active connections (in production, use Redis)
const activeConnections = new Map<string, {
  chatId: string;
  userId: string;
  lastActivity: Date;
}>();

const typingUsers = new Map<string, Set<string>>(); // chatId -> Set of userIds

// GET - Get real-time status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat ID is required'
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

    // Get online participants
    const onlineParticipants = Array.from(activeConnections.values())
      .filter(conn => conn.chatId === chatId)
      .map(conn => conn.userId);

    // Get typing users
    const typingInChat = Array.from(typingUsers.get(chatId) || []);

    return NextResponse.json<IChatApiResponse>({
      success: true,
      message: 'Real-time status retrieved',
      data: {
        onlineUsers: onlineParticipants,
        typingUsers: typingInChat,
        connectionStatus: 'connected' as ConnectionStatus
      }
    });

  } catch (error) {
    console.error('Get real-time status error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to get real-time status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Handle real-time actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 });
    }

    await connectToDatabase();

    const body: WebSocketMessage = await request.json();
    const { type, chatId, data } = body;

    // Verify user access to chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(session.user.id)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    const connectionKey = `${session.user.id}-${chatId}`;

    switch (type) {
      case 'join-chat':
        activeConnections.set(connectionKey, {
          chatId,
          userId: session.user.id,
          lastActivity: new Date()
        });
        
        // Update user's online status in chat
        await Chat.findByIdAndUpdate(chatId, {
          $set: {
            'participants.$[elem].isOnline': true,
            'participants.$[elem].lastSeenAt': new Date()
          }
        }, {
          arrayFilters: [{ 'elem.userId': session.user.id }]
        });
        break;

      case 'leave-chat':
        activeConnections.delete(connectionKey);
        
        // Remove from typing if they were typing
        if (typingUsers.has(chatId)) {
          typingUsers.get(chatId)?.delete(session.user.id);
        }
        
        // Update user's offline status
        await Chat.findByIdAndUpdate(chatId, {
          $set: {
            'participants.$[elem].isOnline': false,
            'participants.$[elem].lastSeenAt': new Date()
          }
        }, {
          arrayFilters: [{ 'elem.userId': session.user.id }]
        });
        break;

      case 'typing-start':
        if (!typingUsers.has(chatId)) {
          typingUsers.set(chatId, new Set());
        }
        typingUsers.get(chatId)?.add(session.user.id);
        
        // Auto-remove typing after 3 seconds
        setTimeout(() => {
          typingUsers.get(chatId)?.delete(session.user.id);
        }, 3000);
        break;

      case 'typing-stop':
        typingUsers.get(chatId)?.delete(session.user.id);
        break;

      case 'mark-read':
        if (data?.messageId) {
          await Message.markChatAsRead(chatId, session.user.id);
          
          // Update message read status
          await Message.findByIdAndUpdate(data.messageId, {
            $push: {
              readBy: {
                userId: session.user.id,
                userName: session.user.name,
                readAt: new Date()
              }
            }
          });
        }
        break;

      default:
        return NextResponse.json<IChatApiResponse>({
          success: false,
          message: 'Invalid action type'
        }, { status: 400 });
    }

    return NextResponse.json<IChatApiResponse>({
      success: true,
      message: `Action ${type} completed successfully`
    });

  } catch (error) {
    console.error('Real-time action error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to process real-time action',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Clean up inactive connections (run periodically)
export async function DELETE(request: NextRequest) {
  try {
    const now = new Date();
    const INACTIVE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    for (const [key, connection] of activeConnections.entries()) {
      if (now.getTime() - connection.lastActivity.getTime() > INACTIVE_THRESHOLD) {
        activeConnections.delete(key);
        
        // Update user status to offline
        await Chat.findByIdAndUpdate(connection.chatId, {
          $set: {
            'participants.$[elem].isOnline': false,
            'participants.$[elem].lastSeenAt': connection.lastActivity
          }
        }, {
          arrayFilters: [{ 'elem.userId': connection.userId }]
        });
      }
    }

    return NextResponse.json<IChatApiResponse>({
      success: true,
      message: 'Cleanup completed'
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Cleanup failed'
    }, { status: 500 });
  }
}