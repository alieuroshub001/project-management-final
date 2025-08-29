// components/Chat/ChatCard.tsx
"use client";
import { IChat } from '@/types/chat';
import { formatDistanceToNow } from '@/utils/dateUtils';
import {
  MessageCircle,
  Users,
  Hash,
  Megaphone,
  Pin,
  VolumeX,
  CheckCheck,
  Clock
} from 'lucide-react';

interface ChatCardProps {
  chat: IChat;
  onSelect: () => void;
  isSelected: boolean;
}

export default function ChatCard({ chat, onSelect, isSelected }: ChatCardProps) {
  const getChatIcon = (chatType: string) => {
    const icons = {
      'direct': MessageCircle,
      'group': Users,
      'channel': Hash,
      'announcement': Megaphone
    };
    return icons[chatType as keyof typeof icons] || MessageCircle;
  };

  const getChatName = () => {
    if (chat.name) return chat.name;
    if (chat.chatType === 'direct' && chat.participants.length >= 2) {
      // In a real app, filter out current user
      const otherParticipant = chat.participants.find(p => p.isActive);
      return otherParticipant?.displayName || otherParticipant?.userName || 'Direct Message';
    }
    return 'Chat';
  };

  const getLastMessagePreview = () => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const content = chat.lastMessage.content;
    if (chat.lastMessage.messageType === 'image') return '📷 Photo';
    if (chat.lastMessage.messageType === 'document') return '📎 File';
    if (chat.lastMessage.messageType === 'audio') return '🎵 Audio';
    if (chat.lastMessage.messageType === 'video') return '🎥 Video';
    
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  const getActiveParticipants = () => {
    return chat.participants.filter(p => p.isActive).length;
  };

  const formatLastActivity = () => {
    try {
      return formatDistanceToNow(new Date(chat.lastActivity), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const ChatIcon = getChatIcon(chat.chatType);

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-md'
      }`}
    >
      <div className="flex items-start space-x-4">
        {/* Chat Avatar */}
        <div className="flex-shrink-0 relative">
          {chat.avatar ? (
            <img
              src={chat.avatar.secure_url}
              alt={getChatName()}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <ChatIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
          )}
          
          {/* Online indicator for direct messages */}
          {chat.chatType === 'direct' && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
          )}
        </div>

        {/* Chat Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <h3 className={`font-semibold truncate ${
                isSelected 
                  ? 'text-indigo-900 dark:text-indigo-100' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {getChatName()}
              </h3>
              
              {/* Chat indicators */}
              <div className="flex items-center space-x-1">
                {chat.isPinned && (
                  <Pin className="w-4 h-4 text-blue-500" />
                )}
                {chat.settings.muteNotifications && (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
                {chat.chatType === 'group' && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Users className="w-3 h-3 mr-1" />
                    <span>{getActiveParticipants()}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-1">
              <span className={`text-xs ${
                isSelected 
                  ? 'text-indigo-700 dark:text-indigo-300' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formatLastActivity()}
              </span>
              
              {/* Unread badge */}
              {chat.unreadCount > 0 && (
                <div className="bg-indigo-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </div>
              )}
            </div>
          </div>

          {/* Last message */}
          <div className="flex items-center justify-between">
            <p className={`text-sm truncate ${
              chat.unreadCount > 0
                ? 'text-gray-900 dark:text-white font-medium'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {chat.lastMessage?.senderName && chat.chatType !== 'direct' && (
                <span className="font-medium">
                  {chat.lastMessage.senderName}: 
                </span>
              )}
              {getLastMessagePreview()}
            </p>
            
            {/* Message status for sent messages */}
            {chat.lastMessage?.senderId === 'current-user-id' && (
              <div className="flex-shrink-0 ml-2">
                {chat.lastMessage.deliveryStatus === 'read' && (
                  <CheckCheck className="w-4 h-4 text-blue-500" />
                )}
                {chat.lastMessage.deliveryStatus === 'delivered' && (
                  <CheckCheck className="w-4 h-4 text-gray-400" />
                )}
                {chat.lastMessage.deliveryStatus === 'sent' && (
                  <Clock className="w-4 h-4 text-gray-400" />
                )}
              </div>
            )}
          </div>

          {/* Chat description for channels/groups */}
          {chat.description && (chat.chatType === 'channel' || chat.chatType === 'group') && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {chat.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}