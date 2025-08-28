// app/api/chat/[id]/polls/[pollId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import { 
  Chat, 
  ChatParticipant, 
  Poll,
  PollVote,
  ChatActivity,
  IPollDocument 
} from '@/models/Chat';
import { 
  IPollVoteRequest,
  IChatApiResponse, 
  IPoll,
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

// GET - Get single poll with details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; pollId: string }> }
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
    const pollId = params.pollId;

    // Check access
    const hasAccess = await hasChatAccess(chatId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    const poll = await Poll.findOne({
      _id: pollId,
      chatId
    }) as IPollDocument | null;

    if (!poll) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Poll not found'
      }, { status: 404 });
    }

    const convertedPoll = convertToIPoll(poll);

    // Get voter details if not anonymous
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

    return NextResponse.json<IChatApiResponse<IPoll>>({
      success: true,
      message: 'Poll retrieved successfully',
      data: convertedPoll
    });

  } catch (error) {
    console.error('Get poll error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to retrieve poll',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Vote on poll
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; pollId: string }> }
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
    const pollId = params.pollId;

    // Check access
    const hasAccess = await hasChatAccess(chatId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Chat not found or access denied'
      }, { status: 404 });
    }

    const poll = await Poll.findOne({
      _id: pollId,
      chatId
    }) as IPollDocument | null;

    if (!poll) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Poll not found'
      }, { status: 404 });
    }

    // Check if poll is active and not expired
    if (!poll.isActive) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Poll is not active'
      }, { status: 400 });
    }

    if (poll.isExpired()) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Poll has expired'
      }, { status: 400 });
    }

    const body: IPollVoteRequest = await request.json();
    const { optionIds } = body;

    if (!optionIds || optionIds.length === 0) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Option IDs are required'
      }, { status: 400 });
    }

    // Validate multiple votes
    if (!poll.allowMultipleVotes && optionIds.length > 1) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'This poll does not allow multiple votes'
      }, { status: 400 });
    }

    // Validate option IDs
    const validOptionIds = poll.options.map(opt => opt.id);
    const invalidOptions = optionIds.filter(id => !validOptionIds.includes(id));
    if (invalidOptions.length > 0) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Invalid option IDs provided'
      }, { status: 400 });
    }

    // Check if user already voted
    const existingVotes = await PollVote.find({
      pollId: poll._id,
      userId: session.user.id
    });

    if (existingVotes.length > 0) {
      if (!poll.allowMultipleVotes) {
        return NextResponse.json<IChatApiResponse>({
          success: false,
          message: 'You have already voted on this poll'
        }, { status: 400 });
      }
      
      // Remove existing votes if changing vote
      await PollVote.deleteMany({
        pollId: poll._id,
        userId: session.user.id
      });
      
      // Update vote counts
      for (const existingVote of existingVotes) {
        const option = poll.options.find(opt => opt.id === existingVote.optionId);
        if (option && option.voteCount > 0) {
          option.voteCount -= 1;
        }
      }
    }

    // Add new votes
    const newVotes = [];
    for (const optionId of optionIds) {
      const vote = await PollVote.create({
        pollId: poll._id,
        optionId,
        userId: session.user.id,
        userName: session.user.name,
        votedAt: new Date()
      });
      newVotes.push(vote);
      
      // Update option vote count
      const option = poll.options.find(opt => opt.id === optionId);
      if (option) {
        option.voteCount += 1;
      }
    }

    // Update total votes count
    poll.totalVotes = await PollVote.countDocuments({ pollId: poll._id });
    await poll.save();

    // Create activity log
    await ChatActivity.create({
      chatId,
      activityType: 'poll-created', // Using existing activity type, ideally would be 'poll-voted'
      performedBy: session.user.id,
      performedByName: session.user.name,
      description: `${session.user.name} voted on poll: ${poll.question}`,
      metadata: { pollId: (poll._id as any).toString(), optionIds }
    });

    // Update chat last activity
    const chat = await Chat.findById(chatId);
    if (chat) await chat.updateLastActivity();

    const convertedPoll = convertToIPoll(poll);

    // Populate voter details if not anonymous
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

    return NextResponse.json<IChatApiResponse<IPoll>>({
      success: true,
      message: 'Vote recorded successfully',
      data: convertedPoll
    });

  } catch (error) {
    console.error('Vote on poll error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to record vote',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Close poll (only creator or admin)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; pollId: string }> }
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
    const pollId = params.pollId;

    const poll = await Poll.findOne({
      _id: pollId,
      chatId
    }) as IPollDocument | null;

    if (!poll) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Poll not found'
      }, { status: 404 });
    }

    // Check if user can close poll (creator or admin)
    const canClosePoll = poll.createdBy.toString() === session.user.id ||
                        await hasPermission(chatId, session.user.id, 'manage-chat');

    if (!canClosePoll) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Insufficient permissions to close this poll'
      }, { status: 403 });
    }

    // Close the poll
    const closedPoll = await Poll.findByIdAndUpdate(
      pollId,
      { isActive: false },
      { new: true }
    ) as IPollDocument | null;

    if (!closedPoll) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Failed to close poll'
      }, { status: 500 });
    }

    // Create activity log
    await ChatActivity.create({
      chatId,
      activityType: 'poll-closed',
      performedBy: session.user.id,
      performedByName: session.user.name,
      description: `Poll "${poll.question}" was closed`
    });

    // Update chat last activity
    const chat = await Chat.findById(chatId);
    if (chat) await chat.updateLastActivity();

    return NextResponse.json<IChatApiResponse>({
      success: true,
      message: 'Poll closed successfully'
    });

  } catch (error) {
    console.error('Close poll error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to close poll',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}