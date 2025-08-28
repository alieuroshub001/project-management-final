// components/Chat/ChatWindow.tsx
"use client";
import { useState, useEffect, useRef } from 'react';
import { IChatWithDetails, IMessage } from '@/types/chat';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ChatParticipants from './ChatParticipants';
import { Users, X } from 'lucide-react';

interface ChatWindowProps {
  chat: IChatWithDetails;
  onChatUpdate: () => void;
}

export default function ChatWindow({ chat, onChatUpdate }: ChatWindowProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (pageNum: number = 1, reset: boolean = true) => {
    try {
      if (reset) setLoading(true);
      
      const response = await fetch(
        `/api/chat/${chat.id}/messages?page=${pageNum}&limit=50`
      );
      const data = await response.json();

      if (response.ok) {
        if (reset) {
          setMessages(data.data.messages);
        } else {
          setMessages(prev => [...data.data.messages, ...prev]);
        }
        setHasMore(data.data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    try {
      let cloudinaryAttachments = [];

      // Upload attachments first if any
      if (attachments && attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach(file => formData.append('files', file));
        formData.append('chatId', chat.id);

        const uploadResponse = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          cloudinaryAttachments = uploadData.files;
        }
      }

      // Send message
      const response = await fetch(`/api/chat/${chat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          cloudinaryAttachments
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.data]);
        onChatUpdate();
        scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage, false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chat) {
      setPage(1);
      fetchMessages(1, true);
    }
  }, [chat.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <ChatHeader
        chat={chat}
        onShowParticipants={() => setShowParticipants(true)}
        onChatUpdate={onChatUpdate}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <ChatMessages
              messages={messages}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              currentUserId={chat.currentUserRole ? 'current-user' : ''}
            />
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={false} // Add logic for permissions
              placeholder={`Message ${chat.name}...`}
            />
          </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Participants ({chat.onlineParticipants.length})
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ChatParticipants
              participants={chat.onlineParticipants}
              chatId={chat.id}
              currentUserRole={chat.currentUserRole}
              onUpdate={onChatUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
}