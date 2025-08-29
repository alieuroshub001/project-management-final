// app/api/chat/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/chat/Chat';
import Message from '@/models/chat/Message';
import User from '@/models/User';
import ChatActivity from '@/models/chat/ChatActivity';
import UserChatPreferences from '@/models/chat/UserChatPreferences';
import { 
  IChatApiResponse,
  IChatDashboard,
  IChatActivity,
  ISearchableUser
} from '@/types/chat';

// Dashboard-specific interfaces
interface IChatStats {
  totalChats: number;
  directMessages: number;
  groupChats: number;
  channels: number;
  pinnedChats: number;
  archivedChats: number;
  unreadChats: number;
}

interface IMessageStats {
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
  mediaMessages: number;
  documentMessages: number;
  averageMessagesPerDay: number;
}

interface IActivitySummary {
  totalActivities: number;
  chatActivities: number;
  messageActivities: number;
  participantActivities: number;
}

interface IUserEngagement {
  totalUnreadMessages: number;
  totalMentions: number;
  totalReactions: number;
}

interface IRecentActivity {
  id: string;
  chatId: string;
  chatName?: string;
  chatType?: string;
  chatAvatar?: any;
  activityType: string;
  performedBy: string;
  performedByName: string;
  targetUserId?: string;
  targetUserName?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

interface IPopularChat {
  id: string;
  name?: string;
  chatType: string;
  avatar?: any;
  messageCount: number;
  uniqueSenders: number;
  lastActivity: Date;
  participantCount: number;
}

interface IDailyTrend {
  date: string;
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
}

interface IChatDashboardData {
  timeframe: string;
  chatStats: IChatStats;
  messageStats: IMessageStats;
  activitySummary: IActivitySummary;
  userEngagement: IUserEngagement;
  recentActivity: IRecentActivity[];
  popularChats: IPopularChat[];
  dailyTrends: IDailyTrend[];
  lastUpdated: Date;
}
import { authOptions } from '@/lib/auth';

// GET - Get chat dashboard data
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
    const timeframe = searchParams.get('timeframe') || '7d'; // '24h', '7d', '30d', '90d', 'all'
    const includeDetails = searchParams.get('includeDetails') === 'true';

    // Calculate date range
    let startDate: Date | undefined;
    const now = new Date();

    switch (timeframe) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = undefined;
    }

    // Build base query for user's chats
    const userChatQuery = {
      'participants.userId': session.user.id,
      'participants.isActive': true
    };

    // Get user's chat IDs
    const userChats = await Chat.find(userChatQuery).select('_id');
    const userChatIds = userChats.map(chat => chat._id);

    // Build time-filtered query
    const timeQuery = startDate ? { createdAt: { $gte: startDate } } : {};

    // 1. Chat Statistics
    const chatStats: IChatStats = {
      totalChats: userChats.length,
      directMessages: await Chat.countDocuments({
        ...userChatQuery,
        chatType: 'direct'
      }),
      groupChats: await Chat.countDocuments({
        ...userChatQuery,
        chatType: 'group'
      }),
      channels: await Chat.countDocuments({
        ...userChatQuery,
        chatType: 'channel'
      }),
      pinnedChats: await Chat.countDocuments({
        ...userChatQuery,
        isPinned: true
      }),
      archivedChats: await Chat.countDocuments({
        ...userChatQuery,
        isArchived: true
      }),
      unreadChats: await Chat.countDocuments({
        ...userChatQuery,
        'participants.unreadCount': { $gt: 0 },
        'participants.userId': session.user.id
      })
    };

    // 2. Message Statistics
    const messageQuery = {
      chatId: { $in: userChatIds },
      isDeleted: false,
      ...timeQuery
    };

    const [
      totalMessages,
      sentMessages,
      receivedMessages,
      mediaMessages,
      documentMessages
    ] = await Promise.all([
      Message.countDocuments(messageQuery),
      Message.countDocuments({
        ...messageQuery,
        senderId: session.user.id
      }),
      Message.countDocuments({
        ...messageQuery,
        senderId: { $ne: session.user.id }
      }),
      Message.countDocuments({
        ...messageQuery,
        messageType: { $in: ['image', 'video', 'audio'] }
      }),
      Message.countDocuments({
        ...messageQuery,
        messageType: 'document'
      })
    ]);

    const messageStats: IMessageStats = {
      totalMessages,
      sentMessages,
      receivedMessages,
      mediaMessages,
      documentMessages,
      averageMessagesPerDay: startDate ? 
        Math.round(totalMessages / Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))) : 0
    };

    // 3. Activity Summary
    const activityQuery = {
      chatId: { $in: userChatIds },
      ...timeQuery
    };

    const [
      totalActivities,
      chatActivities,
      messageActivities,
      participantActivities
    ] = await Promise.all([
      ChatActivity.countDocuments(activityQuery),
      ChatActivity.countDocuments({
        ...activityQuery,
        activityType: { $in: ['chat-created', 'chat-settings-changed', 'chat-archived'] }
      }),
      ChatActivity.countDocuments({
        ...activityQuery,
        activityType: { $in: ['message-sent', 'message-edited', 'message-deleted', 'message-pinned'] }
      }),
      ChatActivity.countDocuments({
        ...activityQuery,
        activityType: { $in: ['participant-added', 'participant-removed', 'participant-left', 'role-changed'] }
      })
    ]);

    const activitySummary: IActivitySummary = {
      totalActivities,
      chatActivities,
      messageActivities,
      participantActivities
    };

    // 4. User Engagement
    const userEngagement: IUserEngagement = {
      totalUnreadMessages: await Message.countDocuments({
        chatId: { $in: userChatIds },
        senderId: { $ne: session.user.id },
        readBy: { 
          $not: { 
            $elemMatch: { userId: new mongoose.Types.ObjectId(session.user.id) } 
          } 
        },
        isDeleted: false
      }),
      totalMentions: await Message.countDocuments({
        chatId: { $in: userChatIds },
        'mentions.mentionedUserId': session.user.id,
        'mentions.isRead': false,
        isDeleted: false
      }),
      totalReactions: await Message.countDocuments({
        chatId: { $in: userChatIds },
        'reactions.userId': session.user.id,
        isDeleted: false
      })
    };

    let recentActivity: IRecentActivity[] = [];
    let popularChats: IPopularChat[] = [];

    if (includeDetails) {
      // 5. Recent Activity
      const activities = await ChatActivity.find(activityQuery)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('chatId', 'name chatType avatar');

      recentActivity = activities.map((activity: any) => ({
        id: activity._id.toString(),
        chatId: activity.chatId._id.toString(),
        chatName: activity.chatId.name || 'Direct Message',
        chatType: activity.chatId.chatType,
        chatAvatar: activity.chatId.avatar,
        activityType: activity.activityType,
        performedBy: activity.performedBy.toString(),
        performedByName: activity.performedByName,
        targetUserId: activity.targetUserId?.toString(),
        targetUserName: activity.targetUserName,
        description: activity.description,
        metadata: activity.metadata,
        createdAt: activity.createdAt
      }));

      // 6. Popular Chats (by message count in timeframe)
      const popularChatsAgg = await Message.aggregate([
        {
          $match: {
            chatId: { $in: userChatIds },
            isDeleted: false,
            ...(startDate && { createdAt: { $gte: startDate } })
          }
        },
        {
          $group: {
            _id: '$chatId',
            messageCount: { $sum: 1 },
            lastActivity: { $max: '$createdAt' },
            uniqueSenders: { $addToSet: '$senderId' }
          }
        },
        {
          $sort: { messageCount: -1 }
        },
        {
          $limit: 5
        },
        {
          $lookup: {
            from: 'chats',
            localField: '_id',
            foreignField: '_id',
            as: 'chat'
          }
        }
      ]);

      popularChats = popularChatsAgg.map((item: any) => ({
        id: item._id.toString(),
        name: item.chat[0]?.name || 'Direct Message',
        chatType: item.chat[0]?.chatType,
        avatar: item.chat[0]?.avatar,
        messageCount: item.messageCount,
        uniqueSenders: item.uniqueSenders.length,
        lastActivity: item.lastActivity,
        participantCount: item.chat[0]?.participants?.filter((p: any) => p.isActive)?.length || 0
      }));
    }

    // 7. Daily Message Trends (last 7 days)
    const dailyTrends = await Message.aggregate([
      {
        $match: {
          chatId: { $in: userChatIds },
          isDeleted: false,
          createdAt: { 
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) 
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          messageCount: { $sum: 1 },
          sentCount: {
            $sum: {
              $cond: [
                { $eq: ['$senderId', new mongoose.Types.ObjectId(session.user.id)] },
                1,
                0
              ]
            }
          },
          receivedCount: {
            $sum: {
              $cond: [
                { $ne: ['$senderId', new mongoose.Types.ObjectId(session.user.id)] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const dashboardData: IChatDashboardData = {
      timeframe,
      chatStats,
      messageStats,
      activitySummary,
      userEngagement,
      recentActivity,
      popularChats,
      dailyTrends: dailyTrends.map((trend: any) => ({
        date: trend._id,
        totalMessages: trend.messageCount,
        sentMessages: trend.sentCount,
        receivedMessages: trend.receivedCount
      })),
      lastUpdated: new Date()
    };

    return NextResponse.json<IChatApiResponse<IChatDashboardData>>({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to retrieve dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Get custom dashboard analytics
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

    const body = await request.json();
    const {
      dateRange,
      chatIds,
      analyticsType,
      groupBy = 'day'
    } = body;

    if (!dateRange || !dateRange.start || !dateRange.end) {
      return NextResponse.json<IChatApiResponse>({
        success: false,
        message: 'Date range is required'
      }, { status: 400 });
    }

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    // Build chat query
    let chatQuery: any = {
      'participants.userId': session.user.id,
      'participants.isActive': true
    };

    if (chatIds && chatIds.length > 0) {
      chatQuery._id = { $in: chatIds };
    }

    const userChats = await Chat.find(chatQuery).select('_id');
    const userChatIds = userChats.map(chat => chat._id);

    let results: any = {};

    if (analyticsType === 'messages' || analyticsType === 'all') {
      // Message analytics
      const messageAnalytics = await Message.aggregate([
        {
          $match: {
            chatId: { $in: userChatIds },
            isDeleted: false,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: groupBy === 'hour' ? 
                { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } } :
                groupBy === 'day' ?
                { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } :
                { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              messageType: '$messageType'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            data: {
              $push: {
                messageType: '$_id.messageType',
                count: '$count'
              }
            },
            totalMessages: { $sum: '$count' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      results.messageAnalytics = messageAnalytics;
    }

    if (analyticsType === 'activity' || analyticsType === 'all') {
      // Activity analytics
      const activityAnalytics = await ChatActivity.aggregate([
        {
          $match: {
            chatId: { $in: userChatIds },
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: groupBy === 'hour' ? 
                { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } } :
                groupBy === 'day' ?
                { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } :
                { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              activityType: '$activityType'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            data: {
              $push: {
                activityType: '$_id.activityType',
                count: '$count'
              }
            },
            totalActivities: { $sum: '$count' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      results.activityAnalytics = activityAnalytics;
    }

    if (analyticsType === 'engagement' || analyticsType === 'all') {
      // Engagement analytics (reactions, mentions)
      const engagementAnalytics = await Message.aggregate([
        {
          $match: {
            chatId: { $in: userChatIds },
            isDeleted: false,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $project: {
            date: groupBy === 'hour' ? 
              { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } } :
              groupBy === 'day' ?
              { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } :
              { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            reactionCount: { $size: { $ifNull: ['$reactions', []] } },
            mentionCount: { $size: { $ifNull: ['$mentions', []] } },
            hasReactions: { $gt: [{ $size: { $ifNull: ['$reactions', []] } }, 0] },
            hasMentions: { $gt: [{ $size: { $ifNull: ['$mentions', []] } }, 0] }
          }
        },
        {
          $group: {
            _id: '$date',
            totalReactions: { $sum: '$reactionCount' },
            totalMentions: { $sum: '$mentionCount' },
            messagesWithReactions: { $sum: { $cond: ['$hasReactions', 1, 0] } },
            messagesWithMentions: { $sum: { $cond: ['$hasMentions', 1, 0] } }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      results.engagementAnalytics = engagementAnalytics;
    }

    return NextResponse.json<IChatApiResponse<any>>({
      success: true,
      message: 'Custom analytics retrieved successfully',
      data: {
        dateRange: { start: startDate, end: endDate },
        groupBy,
        analyticsType,
        results
      }
    });

  } catch (error) {
    console.error('Custom analytics error:', error);
    return NextResponse.json<IChatApiResponse>({
      success: false,
      message: 'Failed to retrieve custom analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}