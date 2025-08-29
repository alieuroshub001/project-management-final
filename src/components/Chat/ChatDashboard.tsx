// components/Chat/ChatDashboard.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  IChatDashboard, 
  IChatApiResponse 
} from '@/types/chat';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {ChatQuickActions} from './ChatQuickActions';
import {RecentChats} from './RecentChat';
import {OnlineUsers} from './OnlineUsers';
import {RecentAnnouncements} from './RecentAnnouncements';
import {ChatStats} from './ChatStats';
import {
  MessageSquare,
  Users,
  MessageCircle,
  Megaphone,
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface ChatDashboardProps {
  selectedChatId?: string | null;
  onChatSelect: (chatId: string) => void;
}

export default function ChatDashboard({ 
  selectedChatId, 
  onChatSelect 
}: ChatDashboardProps) {
  const [dashboard, setDashboard] = useState<IChatDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat/dashboard');
      const data: IChatApiResponse<IChatDashboard> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard');
      }

      setDashboard(data.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
          <h3 className="text-lg font-medium text-red-700 dark:text-red-300">Error Loading Dashboard</h3>
        </div>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Dashboard Data</h3>
        <p className="text-gray-500 dark:text-gray-400">Unable to load dashboard information.</p>
      </div>
    );
  }

  const overviewStats = [
    {
      title: 'Total Chats',
      value: dashboard.totalChats,
      icon: MessageSquare,
      color: 'indigo',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Unread Messages',
      value: dashboard.unreadMessages,
      icon: MessageCircle,
      color: 'red',
      change: '+5',
      changeType: 'increase'
    },
    {
      title: 'Direct Messages',
      value: dashboard.directMessages,
      icon: Users,
      color: 'green',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Group Chats',
      value: dashboard.groupChats,
      icon: Users,
      color: 'blue',
      change: '+3',
      changeType: 'increase'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        text: 'text-indigo-600 dark:text-indigo-400'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        text: 'text-green-600 dark:text-green-400'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-600 dark:text-red-400'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-600 dark:text-blue-400'
      },
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        icon: 'text-amber-600 dark:text-amber-400',
        text: 'text-amber-600 dark:text-amber-400'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        text: 'text-purple-600 dark:text-purple-400'
      }
    };
    return colors[color as keyof typeof colors] || colors.indigo;
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <ChatQuickActions />

      {/* Overview Stats */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Chat Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewStats.map((stat, index) => {
            const IconComponent = stat.icon;
            const colorClasses = getColorClasses(stat.color);
            
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
                      <IconComponent className={`w-6 h-6 ${colorClasses.icon}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
                {stat.change && (
                  <div className="mt-4 flex items-center">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last week</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Chats - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentChats 
            chats={dashboard.recentChats} 
            onChatSelect={onChatSelect}
          />
        </div>
        
        {/* Online Users */}
        <div>
          <OnlineUsers users={dashboard.onlineUsers} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Announcements */}
        <RecentAnnouncements announcements={dashboard.announcements} />
        
        {/* Chat Stats */}
        <ChatStats />
      </div>
    </div>
  );
}