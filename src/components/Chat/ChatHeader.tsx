// components/Chat/ChatHeader.tsx
"use client";
import { useState } from 'react';
import { IChatWithDetails } from '@/types/chat';
import {
  Users,
  Settings,
  Search,
  Phone,
  Video,
  MoreVertical,
  Pin,
  Archive,
  Bell,
  BellOff,
  Hash,
  Lock,
  Crown,
  Shield
} from 'lucide-react';

interface ChatHeaderProps {
  chat: IChatWithDetails;
  onShowParticipants: () => void;
  onChatUpdate: () => void;
}

export default function ChatHeader({
  chat,
  onShowParticipants,
  onChatUpdate
}: ChatHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const getChatIcon = () => {
    switch (chat.type) {
      case 'direct':
        return <Lock className="w-4 h-4 text-gray-500" />;
      case 'group':
        return <Users className="w-4 h-4 text-gray-500" />;
      case 'channel':
        return <Hash className="w-4 h-4 text-gray-500" />;
      case 'announcement':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getRoleIcon = () => {
    switch (chat.currentUserRole) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getOnlineCount = () => {
    return chat.onlineParticipants.filter(p => p.isActive).length;
  };

  const handleArchive = async () => {
    try {
      const response = await fetch(`/api/chat/${chat.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        onChatUpdate();
      }
    } catch (error) {
      console.error('Failed to archive chat:', error);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Left Side - Chat Info */}
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {chat.avatar ? (
            <img
              src={chat.avatar.secure_url}
              alt={chat.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
              {getChatIcon() || <Users className="w-5 h-5 text-gray-500" />}
            </div>
          )}
        </div>

        {/* Chat Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {chat.name}
            </h1>
            {chat.isPinned && <Pin className="w-4 h-4 text-yellow-500" />}
            {getRoleIcon()}
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            {chat.type === 'direct' ? (
              <span>Direct Message</span>
            ) : (
              <>
                <span>{chat.onlineParticipants.length} members</span>
                <span>•</span>
                <span>{getOnlineCount()} online</span>
              </>
            )}
            {chat.unreadCount > 0 && (
              <>
                <span>•</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  {chat.unreadCount} unread
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center space-x-2">
        {/* Search */}
        <button
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Search messages"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Voice Call (for direct chats) */}
        {chat.type === 'direct' && (
          <>
            <button
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Voice call"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Video call"
            >
              <Video className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Participants */}
        {chat.type !== 'direct' && (
          <button
            onClick={onShowParticipants}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Show participants"
          >
            <Users className="w-5 h-5" />
          </button>
        )}

        {/* More Actions */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  // Handle mute/unmute
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <Bell className="w-4 h-4 mr-2" />
                Mute notifications
              </button>
              
              <button
                onClick={() => {
                  setShowDropdown(false);
                  // Handle pin/unpin
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <Pin className="w-4 h-4 mr-2" />
                {chat.isPinned ? 'Unpin chat' : 'Pin chat'}
              </button>
              
              <button
                onClick={() => {
                  setShowDropdown(false);
                  // Handle settings
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Chat settings
              </button>
              
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              
              <button
                onClick={() => {
                  setShowDropdown(false);
                  handleArchive();
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}