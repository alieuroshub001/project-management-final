// app/api/chat/[id]/messages/[messageId]/reactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/chat/Chat';
import Message from '@/models/chat/Message';
import { 
  IReactionAddRequest,
  IChatApiResponse, 
  IMessageReaction
} from '@/types/chat';
import { authOptions } from '@/lib/auth';

// POST - Add reaction to message
export async function POST(
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

    // Check if reactions are allowed
    if (!chat.settings.allowReactions) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Reactions are not allowed in this chat'
      }, { status: 403 });
    }

    const message = await Message.findById(params.messageId);
    if (!message || message.chatId.toString() !== params.id) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Message not found'
      }, { status: 404 });
    }

    const body: IReactionAddRequest = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Emoji is required'
      }, { status: 400 });
    }

    // Add reaction
    message.addReaction(session.user.id, session.user.name, emoji);
    await message.save();

    const addedReaction: IMessageReaction = {
      id: message.reactions[message.reactions.length - 1].id,
      messageId: params.messageId,
      userId: session.user.id,
      userName: session.user.name,
      emoji,
      createdAt: new Date()
    };

    return NextResponse.json<IChatApiResponse<IMessageReaction>>({
      success: true,
      message: 'Reaction added successfully',
      data: addedReaction
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to add reaction',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Remove reaction from message
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

    const { searchParams } = new URL(request.url);
    const emoji = searchParams.get('emoji');

    if (!emoji) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Emoji parameter is required'
      }, { status: 400 });
    }

    // Remove reaction
    message.removeReaction(session.user.id, emoji);
    await message.save();

    return NextResponse.json<IChatApiResponse>({
      success: true,
      message: 'Reaction removed successfully'
    });

  } catch (error) {
    console.error('Remove reaction error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to remove reaction',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}