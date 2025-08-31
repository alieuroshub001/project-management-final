// components/Chat/ChatWindow.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  IChatWithDetails,
  IMessage,
  IMessageBubble,
  IMessageGroup,
  ITypingUser,
  ConnectionStatus,
  MessageStatus
} from '@/types/chat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  ArrowLeft,
  Users,
  Phone,
  Video,
  MoreVertical,
  Search,
  Info
} from 'lucide-react';
import Image from 'next/image';

interface ChatWindowProps {
  chatId: string;
  onBack: () => void;
  onShowInfo?: () => void;
}

export default function ChatWindow({ chatId, onBack, onShowInfo }: ChatWindowProps) {
  const { data: session } = useSession();
  const [chat, setChat] = useState<IChatWithDetails | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [typingUsers, setTypingUsers] = useState<ITypingUser[]>([]);
  const [replyTo, setReplyTo] = useState<IMessageBubble | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch chat and messages
  const fetchChat = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chat/${chatId}?includeDetails=true`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch chat');
      }

      setChat(data.data);
      setMessages(data.data.recentMessages || []);
      setConnectionStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chat');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
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
  }, [chatId, chat, messages]);

  // Send message
  const sendMessage = async (content: string, attachments?: File[]) => {
    if (!session?.user || !chat) return;

    const tempMessage: IMessage = {
      id: `temp-${Date.now()}`,
      chatId,
      senderId: session.user.id,
      senderName: session.user.name,
      senderEmail: session.user.email,
      content,
      messageType: 'text',
      attachments: [],
      replyTo: replyTo ? {
        messageId: replyTo.id,
        content: replyTo.content,
        senderId: replyTo.isOwn ? session.user.id : 'other',
        senderName: replyTo.senderName || 'User',
        timestamp: replyTo.timestamp,
        attachmentCount: replyTo.attachments?.length || 0
      } : undefined,
      forwardedFrom: undefined,
      reactions: [],
      mentions: [],
      isPinned: false,
      isEdited: false,
      editHistory: [],
      isDeleted: false,
      deletedFor: 'none',
      deliveryStatus: 'sending',
      readBy: [],
      threadId: undefined,
      threadRepliesCount: 0,
      lastThreadReply: undefined,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add temporary message
    setMessages(prev => [...prev, tempMessage]);
    setReplyTo(null);
    scrollToBottom();

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('messageType', 'text');
      
      if (replyTo) {
        formData.append('replyToMessageId', replyTo.id);
      }

      if (attachments) {
        attachments.forEach(file => formData.append('attachments', file));
      }

      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      // Replace temporary message with actual message
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? data.data : msg
      ));

      // Mark message as delivered after a short delay
      setTimeout(() => {
        updateMessageStatus(data.data.id, 'delivered');
      }, 1000);

    } catch (err) {
      console.error('Failed to send message:', err);
      // Update temporary message to show error
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, deliveryStatus: 'failed' as MessageStatus }
          : msg
      ));
    }
  };

  // Update message status
  const updateMessageStatus = async (messageId: string, status: MessageStatus) => {
    try {
      await fetch(`/api/chat/${chatId}/messages/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: [messageId], status })
      });

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, deliveryStatus: status } : msg
      ));
    } catch (err) {
      console.error('Failed to update message status:', err);
    }
  };

  // Handle message actions
  const handleReply = (message: IMessageBubble) => {
    setReplyTo(message);
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? data.data : msg
        ));
      }
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`/api/chat/${chatId}/messages/${messageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, reactions: data.data } : msg
        ));
      }
    } catch (err) {
      console.error('Failed to add reaction:', err);
    }
  };

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing start
    fetch(`/api/chat/realtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'typing-start',
        chatId
      })
    });

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/chat/realtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'typing-stop',
          chatId
        })
      });
    }, 3000);
  }, [chatId]);

  // Convert messages to bubbles
  const convertToBubbles = (messages: IMessage[]): IMessageGroup[] => {
    if (!session?.user) return [];

    const groups: IMessageGroup[] = [];
    let currentGroup: IMessageGroup | null = null;

    messages.forEach((msg, index) => {
      const isOwn = msg.senderId === session.user.id;
      const bubble: IMessageBubble = {
        id: msg.id,
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        status: msg.deliveryStatus as MessageStatus,
        isOwn,
        senderName: msg.senderName,
        senderAvatar: msg.senderProfileImage?.secure_url,
        replyTo: msg.replyTo ? {
          id: msg.replyTo.messageId,
          content: msg.replyTo.content,
          timestamp: new Date(msg.replyTo.timestamp),
          status: 'read' as MessageStatus,
          isOwn: msg.replyTo.senderId === session.user.id,
          senderName: msg.replyTo.senderName,
          messageType: 'text'
        } : undefined,
        attachments: msg.attachments,
        reactions: msg.reactions,
        isEdited: msg.isEdited,
        isForwarded: !!msg.forwardedFrom,
        messageType: msg.messageType as any
      };

      const prevMsg = messages[index - 1];
      const shouldGroup = currentGroup && 
        prevMsg && 
        prevMsg.senderId === msg.senderId &&
        new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 300000; // 5 minutes

      if (shouldGroup && currentGroup) {
        currentGroup.messages.push(bubble);
      } else {
        currentGroup = {
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderAvatar: msg.senderProfileImage?.secure_url,
          messages: [bubble],
          timestamp: new Date(msg.createdAt),
          isOwn
        };
        groups.push(currentGroup);
      }
    });

    return groups;
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effects
  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (messages.length > 0 && session?.user) {
      const unreadMessages = messages.filter(msg => 
        msg.senderId !== session.user.id && 
        !msg.readBy.some(r => r.userId === session.user.id)
      );

      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg.id);
        updateMessageStatus(messageIds[messageIds.length - 1], 'read');
      }
    }
  }, [messages, session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Chat not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const messageGroups = convertToBubbles(messages);
  const getChatName = () => {
    if (chat.name) return chat.name;
    if (chat.chatType === 'direct' && chat.participants.length === 2) {
      const otherParticipant = chat.participants.find(
        p => p.isActive && p.userId !== session?.user?.id
      );
      return otherParticipant?.displayName || otherParticipant?.userName || 'Unknown User';
    }
    return 'Chat';
  };

  const getOnlineCount = () => {
    return chat.participants.filter(p => p.isActive && p.isOnline).length;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Chat avatar */}
          <div className="relative">
            {chat.avatar ? (
              <Image
                src={chat.avatar.secure_url}
                alt={getChatName()}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {getChatName().charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {chat.chatType === 'direct' && getOnlineCount() > 0 && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800" />
            )}
          </div>

          {/* Chat info */}
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">
              {getChatName()}
            </h1>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {chat.chatType === 'direct' ? (
                getOnlineCount() > 0 ? 'Online' : 'Offline'
              ) : (
                `${chat.participants.filter(p => p.isActive).length} members`
              )}
              {typingUsers.length > 0 && (
                <span className="text-indigo-600 dark:text-indigo-400 ml-2">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].userName} is typing...`
                    : `${typingUsers.length} people are typing...`
                  }
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={onShowInfo}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
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

        {messageGroups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="space-y-1">
            {group.messages.map((message, messageIndex) => (
              <MessageBubble
                key={message.id}
                message={message}
                showSender={messageIndex === 0 && chat.chatType !== 'direct'}
                isGrouped={messageIndex > 0}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReaction={handleReaction}
              />
            ))}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <MessageInput
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          placeholder={`Message ${getChatName()}...`}
        />
      </div>
    </div>
  );
}