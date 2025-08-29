// components/Chat/ChatDetails.tsx
"use client";
import { useState, useEffect, useRef } from 'react';
import { 
  IChatWithDetails,
  IChatApiResponse,
  IMessage,
  IMessageSendRequest
} from '@/types/chat';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import {ChatInfo} from './ChatInfo';
import {
  ArrowLeft,
  Users,
  Settings,
  Search,
  Phone,
  Video,
  MoreVertical,
  Hash,
  MessageCircle,
  UserPlus,
  Bell,
  BellOff,
  Archive,
  AlertTriangle
} from 'lucide-react';

interface ChatDetailsProps {
  chatId: string;
  onBack: () => void;
}

export default function ChatDetails({ chatId, onBack }: ChatDetailsProps) {
  const [chat, setChat] = useState<IChatWithDetails | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChat = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/chat/${chatId}?includeDetails=true`);
      const data: IChatApiResponse<IChatWithDetails> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch chat');
      }

      setChat(data.data || null);
      setMessages(data.data?.recentMessages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chat');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!chat || messages.length === 0) return;

    try {
      const oldestMessage = messages[0];
      const response = await fetch(
        `/api/chat/${chatId}/messages?before=${oldestMessage.id}&limit=20`
      );
      const data = await response.json();

      if (response.ok && data.data) {
        setMessages(prev => [...data.data.messages, ...prev]);
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
    }
  };

  const sendMessage = async (messageData: IMessageSendRequest) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      if (data.data) {
        setMessages(prev => [...prev, data.data]);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Show error to user
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatId) {
      fetchChat();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getChatIcon = (chatType: string) => {
    const icons = {
      'direct': MessageCircle,
      'group': Users,
      'channel': Hash,
      'announcement': MoreVertical
    };
    return icons[chatType as keyof typeof icons] || MessageCircle;
  };

  const getChatName = () => {
    if (!chat) return '';
    if (chat.name) return chat.name;
    if (chat.chatType === 'direct' && chat.participants.length === 2) {
      const otherParticipant = chat.participants.find(p => p.isActive && p.userId !== 'current-user-id');
      return otherParticipant?.displayName || otherParticipant?.userName || 'Unknown User';
    }
    return 'Chat';
  };

  const getParticipantCount = () => {
    return chat?.participants.filter(p => p.isActive).length || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Unable to Load Chat
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error || 'Chat not found or you may not have access to view it.'}
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const ChatIcon = getChatIcon(chat.chatType);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <ChatIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getChatName()}
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{getParticipantCount()} members</span>
                    {chat.chatType === 'direct' && (
                      <span className="w-2 h-2 bg-green-400 rounded-full ml-2"></span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Video className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                      <UserPlus className="w-4 h-4 mr-3" />
                      Add Members
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                      <Bell className="w-4 h-4 mr-3" />
                      Mute Notifications
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                      <Archive className="w-4 h-4 mr-3" />
                      Archive Chat
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                      <Settings className="w-4 h-4 mr-3" />
                      Chat Settings
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length > 0 && (
            <div className="text-center">
              <button
                onClick={loadMoreMessages}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
              >
                Load older messages
              </button>
            </div>
          )}

          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.senderId === 'current-user-id'} // Replace with actual user ID
              showSender={
                index === 0 || 
                messages[index - 1].senderId !== message.senderId ||
                new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000 // 5 minutes
              }
            />
          ))}
          
          {isTyping && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>Someone is typing...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <MessageInput onSendMessage={sendMessage} />
        </div>
      </div>

      {/* Chat Info Sidebar */}
      {showInfo && (
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <ChatInfo 
            chat={chat} 
            onClose={() => setShowInfo(false)}
            onUpdate={fetchChat}
          />
        </div>
      )}
    </div>
  );
}