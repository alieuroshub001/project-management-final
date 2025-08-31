// hooks/useChat.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  IMessage, 
  IChatWithDetails, 
  ConnectionStatus, 
  ITypingUser,
  MessageStatus,
  WebSocketMessage
} from '@/types/chat';

interface UseChatReturn {
  messages: IMessage[];
  chat: IChatWithDetails | null;
  loading: boolean;
  error: string;
  connectionStatus: ConnectionStatus;
  typingUsers: ITypingUser[];
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  markAsRead: (messageId?: string) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  loadMoreMessages: () => Promise<void>;
  refreshChat: () => Promise<void>;
}

export function useChat(chatId: string): UseChatReturn {
  const { data: session } = useSession();
  
  // State
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [chat, setChat] = useState<IChatWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [typingUsers, setTypingUsers] = useState<ITypingUser[]>([]);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!session?.user || !chatId) return;

    setConnectionStatus('connecting');
    
    // Create WebSocket connection (you'll need to set up WebSocket server)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat/${chatId}?token=${session.user.id}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Join chat room
        ws.send(JSON.stringify({
          type: 'join-chat',
          chatId,
          data: { userId: session.user.id }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect if not a clean close
        if (!event.wasClean && reconnectAttempts.current < 5) {
          reconnectAttempts.current++;
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionStatus('reconnecting');
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = () => {
        setConnectionStatus('disconnected');
      };

      wsRef.current = ws;
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  }, [chatId, session?.user]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'new-message':
        setMessages(prev => [...prev, message.data]);
        break;
        
      case 'message-updated':
        setMessages(prev => prev.map(msg => 
          msg.id === message.data.id ? { ...msg, ...message.data } : msg
        ));
        break;
        
      case 'message-deleted':
        setMessages(prev => prev.filter(msg => msg.id !== message.data.messageId));
        break;
        
      case 'typing-start':
        setTypingUsers(prev => {
          const existing = prev.find(u => u.userId === message.data.userId);
          if (existing) return prev;
          return [...prev, {
            userId: message.data.userId,
            userName: message.data.userName,
            timestamp: new Date()
          }];
        });
        break;
        
      case 'typing-stop':
        setTypingUsers(prev => prev.filter(u => u.userId !== message.data.userId));
        break;
        
      case 'user-online':
      case 'user-offline':
        // Update participant online status
        setChat(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: prev.participants.map(p => 
              p.userId === message.data.userId 
                ? { ...p, isOnline: message.type === 'user-online' }
                : p
            )
          };
        });
        break;
        
      case 'message-reaction':
        setMessages(prev => prev.map(msg => 
          msg.id === message.data.messageId 
            ? { ...msg, reactions: message.data.reactions }
            : msg
        ));
        break;
    }
  }, []);

  // Fetch chat data
  const fetchChat = useCallback(async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/chat/${chatId}?includeDetails=true`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch chat');
      }

      setChat(data.data);
      setMessages(data.data.recentMessages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chat');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // Send message
  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!session?.user || !chat) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: IMessage = {
      id: tempId,
      chatId,
      senderId: session.user.id,
      senderName: session.user.name,
      senderEmail: session.user.email,
      content,
      messageType: attachments && attachments.length > 0 ? 'document' : 'text',
      attachments: [],
      reactions: [],
      mentions: [],
      isPinned: false,
      isEdited: false,
      editHistory: [],
      isDeleted: false,
      deletedFor: 'none',
      deliveryStatus: 'sending',
      readBy: [],
      threadRepliesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('messageType', attachments && attachments.length > 0 ? 'document' : 'text');
      
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

      // Replace temp message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? data.data : msg
      ));

      // Send via WebSocket for real-time updates
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'send-message',
          chatId,
          data: data.data
        }));
      }

    } catch (error) {
      // Update temp message to show error
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, deliveryStatus: 'failed' as MessageStatus }
          : msg
      ));
      throw error;
    }
  }, [chatId, session?.user, chat]);

  // Edit message
  const editMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? data.data : msg
        ));
      }
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  }, [chatId]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages/${messageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }, [chatId]);

  // Add reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
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
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  }, [chatId]);

  // Mark as read
  const markAsRead = useCallback(async (messageId?: string) => {
    if (!session?.user) return;

    try {
      const unreadMessages = messages.filter(msg => 
        msg.senderId !== session.user.id && 
        !msg.readBy.some(r => r.userId === session.user.id)
      );

      if (unreadMessages.length === 0) return;

      const targetMessageId = messageId || unreadMessages[unreadMessages.length - 1]?.id;
      if (!targetMessageId) return;

      const response = await fetch(`/api/chat/${chatId}/messages/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messageIds: [targetMessageId], 
          status: 'read' 
        })
      });

      if (response.ok) {
        // Update local state
        setMessages(prev => prev.map(msg => ({
          ...msg,
          deliveryStatus: msg.senderId !== session.user.id && !msg.readBy.some(r => r.userId === session.user.id) 
            ? 'read' as MessageStatus 
            : msg.deliveryStatus,
          readBy: msg.senderId !== session.user.id && !msg.readBy.some(r => r.userId === session.user.id)
            ? [...msg.readBy, { userId: session.user.id, userName: session.user.name, readAt: new Date() }]
            : msg.readBy
        })));

        // Send via WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'mark-read',
            chatId,
            data: { messageId: targetMessageId }
          }));
        }
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [chatId, messages, session?.user]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing-start',
        chatId,
        data: { userId: session?.user?.id, userName: session?.user?.name }
      }));
    }

    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [chatId, session?.user]);

  const stopTyping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing-stop',
        chatId,
        data: { userId: session?.user?.id }
      }));
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [chatId, session?.user?.id]);

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    if (messages.length === 0) return;

    try {
      const oldestMessage = messages[0];
      const response = await fetch(
        `/api/chat/${chatId}/messages?before=${oldestMessage.id}&limit=20`
      );
      const data = await response.json();

      if (response.ok && data.data) {
        setMessages(prev => [...data.data.messages, ...prev]);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  }, [chatId, messages]);

  // Refresh chat
  const refreshChat = useCallback(() => {
    fetchChat();
  }, [fetchChat]);

  // Effects
  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Auto-mark messages as read when they come into view
  useEffect(() => {
    if (messages.length > 0 && chat && connectionStatus === 'connected') {
      // Mark as read after a short delay
      const timer = setTimeout(() => {
        markAsRead();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [messages.length, chat, connectionStatus, markAsRead]);

  return {
    messages,
    chat,
    loading,
    error,
    connectionStatus,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    markAsRead,
    startTyping,
    stopTyping,
    loadMoreMessages,
    refreshChat
  };
}