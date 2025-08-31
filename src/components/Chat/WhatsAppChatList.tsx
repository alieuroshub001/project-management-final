// components/Chat/WhatsAppChatList.tsx
"use client";
import { useState, useEffect } from 'react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { 
  IChatListItem,
  IChatApiResponse, 
  IChatListResponse,
  MessageStatus
} from '@/types/chat';
import { 
  Search, 
  Pin,
  VolumeX,
  Check,
  CheckCheck,
  Plus,
  Users,
  MessageCircle,
  Archive,
  Settings
} from 'lucide-react';
import Image from 'next/image';

interface WhatsAppChatListProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId?: string | null;
  searchQuery?: string;
}

export default function WhatsAppChatList({ 
  onChatSelect, 
  selectedChatId,
  searchQuery = '' 
}: WhatsAppChatListProps) {
  const [chats, setChats] = useState<IChatListItem[]>([]);
  const [filteredChats, setFilteredChats] = useState<IChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');

  // Fetch chats
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chat?limit=50`);
      const data: IChatApiResponse<IChatListResponse> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch chats');
      }

      if (data.data) {
        // Transform to ChatListItem format
        const chatItems: IChatListItem[] = data.data.chats.map(chat => ({
          id: chat.id,
          name: chat.name || getChatDisplayName(chat),
          avatar: chat.avatar?.secure_url,
          lastMessage: chat.lastMessage ? {
            content: chat.lastMessage.content,
            timestamp: new Date(chat.lastMessage.createdAt),
            senderId: chat.lastMessage.senderId,
            senderName: chat.lastMessage.senderName,
            messageType: chat.lastMessage.messageType as any
          } : undefined,
          unreadCount: chat.unreadCount,
          isOnline: chat.participants.some(p => p.isOnline),
          isPinned: chat.isPinned,
          isArchived: chat.isArchived,
          isMuted: chat.settings.muteNotifications,
          lastSeen: chat.lastActivity ? new Date(chat.lastActivity) : undefined,
          chatType: chat.chatType as any,
          participants: chat.participants.map(p => ({
            id: p.id,
            name: p.userName,
            avatar: p.profileImage?.secure_url,
            isOnline: p.isOnline
          }))
        }));

        setChats(chatItems);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  // Get chat display name
  const getChatDisplayName = (chat: any) => {
    if (chat.name) return chat.name;
    if (chat.chatType === 'direct' && chat.participants.length === 2) {
      const otherParticipant = chat.participants.find((p: any) => p.isActive);
      return otherParticipant?.displayName || otherParticipant?.userName || 'Unknown User';
    }
    return 'Group Chat';
  };

  // Filter chats based on search and active filter
  useEffect(() => {
    let filtered = chats;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply active filter
    switch (activeFilter) {
      case 'unread':
        filtered = filtered.filter(chat => chat.unreadCount > 0);
        break;
      case 'groups':
        filtered = filtered.filter(chat => chat.chatType === 'group' || chat.chatType === 'channel');
        break;
    }

    // Sort: pinned first, then by last message time
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const aTime = a.lastMessage?.timestamp?.getTime() || 0;
      const bTime = b.lastMessage?.timestamp?.getTime() || 0;
      return bTime - aTime;
    });

    setFilteredChats(filtered);
  }, [chats, searchQuery, activeFilter]);

  // Format message time
  const formatMessageTime = (date: Date) => {
    const now = new Date();
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return format(date, 'EEE');
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  // Get message status icon
  const getMessageStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  // Truncate message content
  const truncateMessage = (content: string, maxLength: number = 40) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    fetchChats();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchChats}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Chats</h1>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'all', label: 'All', count: chats.length },
            { key: 'unread', label: 'Unread', count: chats.filter(c => c.unreadCount > 0).length },
            { key: 'groups', label: 'Groups', count: chats.filter(c => c.chatType !== 'direct').length }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as any)}
              className={`flex-1 text-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeFilter === filter.key
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className={`ml-1 text-xs ${
                  activeFilter === filter.key ? 'text-indigo-500' : 'text-gray-400'
                }`}>
                  ({filter.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No conversations found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No chats match your search.' : 'Start a new conversation to get started.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={`flex items-center space-x-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                  selectedChatId === chat.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-r-2 border-indigo-500' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {chat.avatar ? (
                    <Image
                      src={chat.avatar}
                      alt={chat.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {chat.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Online indicator */}
                  {chat.chatType === 'direct' && chat.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white dark:border-gray-900"></div>
                  )}
                  
                  {/* Group indicator */}
                  {chat.chatType !== 'direct' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                      <Users className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <h3 className={`font-medium truncate ${
                        chat.unreadCount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {chat.name}
                      </h3>
                      
                      {/* Icons */}
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {chat.isPinned && (
                          <Pin className="w-3 h-3 text-gray-400 fill-current" />
                        )}
                        {chat.isMuted && (
                          <VolumeX className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`text-xs ${
                        chat.unreadCount > 0 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {chat.lastMessage ? formatMessageTime(chat.lastMessage.timestamp) : ''}
                      </span>
                      
                      {/* Unread count */}
                      {chat.unreadCount > 0 && (
                        <span className="bg-indigo-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Last Message */}
                  {chat.lastMessage && (
                    <div className="flex items-center space-x-2 mt-1">
                      {/* Message status (only for own messages) */}
                      <div className="flex items-center space-x-1">
                        <span className={`text-sm truncate ${
                          chat.unreadCount > 0 ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {chat.lastMessage.messageType === 'image' ? '📷 Photo' :
                           chat.lastMessage.messageType === 'document' ? '📄 Document' :
                           chat.lastMessage.messageType === 'audio' ? '🎵 Audio' :
                           chat.lastMessage.messageType === 'video' ? '🎥 Video' :
                           truncateMessage(chat.lastMessage.content)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}