// components/Chat/ChatSidebar.tsx
"use client";
import { useState, useEffect } from 'react';
import { IChat, IChatWithDetails } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import {
  Search,
  MessageSquare,
  Users,
  Megaphone,
  Crown,
  Pin,
  Archive,
  RefreshCw,
  MoreVertical,
  Hash,
  Lock
} from 'lucide-react';

interface ChatSidebarProps {
  chats: IChat[];
  selectedChat: IChatWithDetails | null;
  onChatSelect: (chat: IChat) => void;
  loading: boolean;
  onRefresh: () => void;
}

export default function ChatSidebar({
  chats,
  selectedChat,
  onChatSelect,
  loading,
  onRefresh
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'direct' | 'group' | 'channel'>('all');
  const [filteredChats, setFilteredChats] = useState<IChat[]>([]);

  useEffect(() => {
    let filtered = chats;

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(chat => chat.type === filter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by activity
    filtered = [...filtered].sort((a, b) => {
      // Pinned chats first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then by last activity
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });

    setFilteredChats(filtered);
  }, [chats, searchTerm, filter]);

  const getChatIcon = (chat: IChat) => {
    switch (chat.type) {
      case 'direct':
        return MessageSquare;
      case 'group':
        return Users;
      case 'channel':
        return Hash;
      case 'announcement':
        return Megaphone;
      default:
        return MessageSquare;
    }
  };

  const getChatPreview = (chat: IChat) => {
    if (chat.lastMessage) {
      return chat.lastMessage.content.substring(0, 50) + (chat.lastMessage.content.length > 50 ? '...' : '');
    }
    return 'No messages yet';
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'direct', label: 'Direct' },
            { key: 'group', label: 'Groups' },
            { key: 'channel', label: 'Channels' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === filterOption.key
                  ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {searchTerm ? 'No chats found' : 'No chats available'}
            </p>
            {!searchTerm && (
              <button
                onClick={onRefresh}
                className="mt-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm flex items-center mx-auto"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredChats.map((chat) => {
              const IconComponent = getChatIcon(chat);
              const isSelected = selectedChat?.id === chat.id;
              
              return (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat)}
                  className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group ${
                    isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Chat Avatar/Icon */}
                    <div className="flex-shrink-0 relative">
                      {chat.avatar ? (
                        <img
                          src={chat.avatar.secure_url}
                          alt={chat.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isSelected 
                            ? 'bg-indigo-100 dark:bg-indigo-900/30' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${
                            isSelected 
                              ? 'text-indigo-600 dark:text-indigo-400' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`} />
                        </div>
                      )}
                      
                      {/* Status indicators */}
                      <div className="absolute -top-1 -right-1 flex space-x-1">
                        {chat.isPinned && (
                          <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Pin className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium truncate ${
                          isSelected 
                            ? 'text-indigo-900 dark:text-indigo-100' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {chat.name}
                          {chat.type === 'channel' && (
                            <Hash className="w-3 h-3 inline ml-1 opacity-60" />
                          )}
                          {chat.type === 'direct' && (
                            <Lock className="w-3 h-3 inline ml-1 opacity-60" />
                          )}
                        </h3>
                        
                        <div className="flex items-center space-x-1">
                          {chat.lastActivity && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(chat.lastActivity), { addSuffix: false })}
                            </span>
                          )}
                          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity">
                            <MoreVertical className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                          {chat.lastMessage?.senderName && chat.type !== 'direct' && (
                            <span className="font-medium">{chat.lastMessage.senderName}: </span>
                          )}
                          {getChatPreview(chat)}
                        </p>
                        
                        {/* Unread count would go here */}
                        {/* {chat.unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-1 ml-2">
                            {chat.unreadCount}
                          </span>
                        )} */}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}