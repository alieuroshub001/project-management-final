// app/api/chat/[id]/polls/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { 
  Chat, 
  ChatParticipant, 
  Message, 
  Poll,
  PollVote,
  IChatDocument, 
  IPollDocument 
} from '@/models/Chat';
import { 
  IPollCreateRequest,
  IChatApiResponse, 
  IPoll,
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

// Convert poll document to IPoll
function convertToIPoll(doc: IPollDocument): IPoll {
  return {
    id: (doc._id as any).toString(),
    messageId: doc.messageId.toString(),
    chatId: doc.chatId.toString(),
    createdBy: doc.createdBy.toString(),
    createdByName: doc.createdByName,
    question: doc.question,
    options: doc.options.map(opt => ({
      id: opt.id,
      pollId: (doc._id as any).toString(),
      text: opt.text,
      voteCount: opt.voteCount,
      voters: [] // Will be populated if needed
    })),
    allowMultipleVotes: doc.allowMultipleVotes,
    isAnonymous: doc.isAnonymous,
    expiresAt: doc.expiresAt,
    isActive: doc.isActive,
    totalVotes: doc.totalVotes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// GET - List polls in chat
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
    const isActive = searchParams.get('isActive');
    const includeExpired = searchParams.get('includeExpired') === 'true';

    // Build filter
    const filter: any = { chatId };
    
    if (isActive !== null) {
      filter.isActive = isActive === 'true';
    }
    
    if (!includeExpired) {
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ];
    }

    // Execute query
    const skip = (page - 1) * limit;
    const [polls, total] = await Promise.all([
      Poll.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as Promise<IPollDocument[]>,
      Poll.countDocuments(filter)
    ]);

    // Convert polls and populate voter details if needed
    const convertedPolls = await Promise.all(
      polls.map(async (poll) => {
        const convertedPoll = convertToIPoll(poll);
        
        // Get votes for each option if not anonymous
        if (!poll.isAnonymous) {
          for (const option of convertedPoll.options) {
            const votes = await PollVote.find({
              pollId: poll._id,
              optionId: option.id
            });
            
            option.voters = votes.map(vote => ({
              id: vote._id.toString(),
              pollId: vote.pollId.toString(),
              optionId: vote.optionId,
              userId: vote.userId,
              userName: vote.userName,
              votedAt: vote.votedAt
            }));
          }
        }
        
        return convertedPoll;
      })
    );

    return NextResponse.json<IChatApiResponse<{
      polls: IPoll[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>>({
      success: true,
      message: 'Polls retrieved successfully',
      data: {
        polls: convertedPolls,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get polls error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to retrieve polls',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new poll
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

    // Check if user can create polls
    const canCreatePolls = await hasPermission(chatId, session.user.id, 'create-polls');
    if (!canCreatePolls) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Insufficient permissions to create polls'
      }, { status: 403 });
    }

    const chat = await Chat.findById(chatId) as IChatDocument | null;
    if (!chat) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    // Check if polls are enabled for this chat
    if (!chat.settings.allowPolls) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Polls are not enabled for this chat'
      }, { status: 403 });
    }

    const body: IPollCreateRequest = await request.json();
    const {
      question,
      options,
      allowMultipleVotes = false,
      isAnonymous = false,
      expiresIn
    } = body;

    // Validate input
    if (!question || question.trim().length === 0) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Poll question is required'
      }, { status: 400 });
    }

    if (!options || options.length < 2) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Poll must have at least 2 options'
      }, { status: 400 });
    }

    if (options.length > 10) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Poll cannot have more than 10 options'
      }, { status: 400 });
    }

    if (question.length > 500) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Poll question cannot exceed 500 characters'
      }, { status: 400 });
    }

    // Validate options
    const trimmedOptions = options.map(opt => opt.trim()).filter(opt => opt.length > 0);
    if (trimmedOptions.length !== options.length) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'All poll options must be non-empty'
      }, { status: 400 });
    }

    if (trimmedOptions.some(opt => opt.length > 200)) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Poll options cannot exceed 200 characters'
      }, { status: 400 });
    }

    // Check for duplicate options
    const uniqueOptions = [...new Set(trimmedOptions.map(opt => opt.toLowerCase()))];
    if (uniqueOptions.length !== trimmedOptions.length) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Poll options must be unique'
      }, { status: 400 });
    }

    // Calculate expiration date
    let expiresAt: Date | undefined;
    if (expiresIn && expiresIn > 0) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresIn);
    }

    // First create a poll message
    const pollMessage = await Message.create({
      chatId,
      senderId: session.user.id,
      senderName: session.user.name,
      senderEmail: session.user.email,
      content: `📊 Poll: ${question}`,
      messageType: 'poll'
    });

    // Create poll options with unique IDs
    const pollOptions = trimmedOptions.map(text => ({
      id: new mongoose.Types.ObjectId().toString(),
      text,
      voteCount: 0
    }));

    // Create the poll
    const pollData = {
      messageId: pollMessage._id,
      chatId,
      createdBy: session.user.id,
      createdByName: session.user.name,
      question: question.trim(),
      options: pollOptions,
      allowMultipleVotes,
      isAnonymous,
      expiresAt,
      isActive: true,
      totalVotes: 0
    };

    const poll = await Poll.create(pollData) as IPollDocument;

    // Update the message with poll metadata
    pollMessage.metadata = { pollId: (poll._id as any).toString() };
    await pollMessage.save();

    // Update chat last message and activity
    chat.lastMessageId = pollMessage._id as any;
    await chat.updateLastActivity();

    const convertedPoll = convertToIPoll(poll);

    return NextResponse.json<IChatApiResponse<IPoll>>({
      success: true,
      message: 'Poll created successfully',
      data: convertedPoll
    }, { status: 201 });

  } catch (error) {
    console.error('Create poll error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to create poll',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}