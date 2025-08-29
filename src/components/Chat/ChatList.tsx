// components/Employee/Chat/ChatList.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  IChat, 
  IChatApiResponse, 
  IChatListResponse,
  ChatType 
} from '@/types/chat';
import ChatCard from './ChatCard';
import ChatFilters from './ChatFilters';
import NewChatModal from './NewChatModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Search, 
  Filter,
  MessageSquare,
  Plus,
  Users,
  Hash,
  MessageCircle
} from 'lucide-react';

interface ChatListProps {
  searchQuery: string;
  onChatSelect: (chatId: string) => void;
  selectedChatId?: string | null;
}

export default function ChatList({ 
  searchQuery, 
  onChatSelect, 
  selectedChatId 
}: ChatListProps) {
  const [chats, setChats] = useState<IChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    chatType: [] as ChatType[],
    hasUnread: false,
    isPinned: false,
    isArchived: false
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalChats, setTotalChats] = useState(0);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { query: searchQuery }),
        ...(filters.chatType.length > 0 && { chatType: filters.chatType[0] }),
        ...(filters.hasUnread && { hasUnread: 'true' }),
        ...(filters.isPinned && { isPinned: 'true' }),
        ...(filters.isArchived && { isArchived: 'true' })
      });

      const response = await fetch(`/api/chat?${params}`);
      const data: IChatApiResponse<IChatListResponse> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch chats');
      }

      if (data.data) {
        setChats(data.data.chats);
        setHasMore(data.data.hasMore);
        setTotalChats(data.data.totalCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [page, filters, searchQuery]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filtering
  };

  const getChatTypeIcon = (chatType: ChatType) => {
    const icons = {
      'direct': MessageCircle,
      'group': Users,
      'channel': Hash,
      'announcement': MessageSquare
    };
    return icons[chatType] || MessageCircle;
  };

  const getChatTypeColor = (chatType: ChatType) => {
    const colors = {
      'direct': 'text-blue-600 dark:text-blue-400',
      'group': 'text-green-600 dark:text-green-400', 
      'channel': 'text-purple-600 dark:text-purple-400',
      'announcement': 'text-orange-600 dark:text-orange-400'
    };
    return colors[chatType] || colors.direct;
  };

  const chatTypeStats = [
    {
      type: 'direct' as ChatType,
      label: 'Direct Messages',
      count: chats.filter(chat => chat.chatType === 'direct').length
    },
    {
      type: 'group' as ChatType,
      label: 'Group Chats',
      count: chats.filter(chat => chat.chatType === 'group').length
    },
    {
      type: 'channel' as ChatType,
      label: 'Channels',
      count: chats.filter(chat => chat.chatType === 'channel').length
    }
  ];

  if (loading && chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 dark:text-gray-400">Loading your conversations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {totalChats} conversation{totalChats !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>

          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </button>
        </div>
      </div>

      {/* Chat Type Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {chatTypeStats.map((stat) => {
          const IconComponent = getChatTypeIcon(stat.type);
          const colorClass = getChatTypeColor(stat.type);
          
          return (
            <div key={stat.type} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <IconComponent className={`w-5 h-5 mr-3 ${colorClass}`} />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      {showFilters && (
        <ChatFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={fetchChats}
            className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            Try again
          </button>
        </div>
      )}

      {/* Chat List */}
      {chats.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No conversations found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
            {searchQuery || Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f)
              ? 'No conversations match your current search and filters. Try adjusting your criteria.'
              : 'Start a new conversation to get connected with your team.'}
          </p>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start New Chat
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {chats.map(chat => (
            <ChatCard
              key={chat.id}
              chat={chat}
              onSelect={() => onChatSelect(chat.id)}
              isSelected={selectedChatId === chat.id}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={loading}
            className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Load More Chats'}
          </button>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onSuccess={(chatId) => {
            setShowNewChatModal(false);
            onChatSelect(chatId);
          }}
        />
      )}
    </div>
  );
}