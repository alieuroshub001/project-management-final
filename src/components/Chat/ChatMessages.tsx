// components/Chat/ChatMessages.tsx
"use client";
import { useState, useRef, useEffect } from 'react';
import { IMessage } from '@/types/chat';
import { formatDistanceToNow, format, isSameDay } from 'date-fns';
import {
  MoreVertical,
  Reply,
  Copy,
  Edit,
  Trash2,
  Download,
  Eye,
  ThumbsUp,
  Heart,
  Smile,
  Pin,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Loader2
} from 'lucide-react';

interface ChatMessagesProps {
  messages: IMessage[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  currentUserId: string;
}

export default function ChatMessages({
  messages,
  loading,
  hasMore,
  onLoadMore,
  currentUserId
}: ChatMessagesProps) {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for load more
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      // API call would go here
      console.log('React to message:', messageId, emoji);
    } catch (error) {
      console.error('Failed to react:', error);
    }
    setShowReactions(null);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    setSelectedMessage(null);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return ImageIcon;
      case 'video':
        return Video;
      case 'audio':
        return Music;
      default:
        return FileText;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderMessage = (message: IMessage, index: number) => {
    const isOwnMessage = message.senderId === currentUserId;
    const nextMessage = messages[index + 1];
    const prevMessage = messages[index - 1];
    
    const showAvatar = !isOwnMessage && (
      !nextMessage || 
      nextMessage.senderId !== message.senderId ||
      !isSameDay(new Date(message.createdAt), new Date(nextMessage.createdAt))
    );
    
    const showTimestamp = !prevMessage || 
      !isSameDay(new Date(message.createdAt), new Date(prevMessage.createdAt)) ||
      new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000; // 5 minutes

    return (
      <div key={message.id} className="group">
        {/* Date separator */}
        {showTimestamp && (
          <div className="flex justify-center my-4">
            <span className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
              {format(new Date(message.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {/* Message */}
        <div className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          {/* Avatar for other users */}
          {!isOwnMessage && (
            <div className="flex-shrink-0 mr-3">
              {showAvatar ? (
                message.senderAvatar ? (
                  <img
                    src={message.senderAvatar.secure_url}
                    alt={message.senderName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {message.senderName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )
              ) : (
                <div className="w-8 h-8"></div>
              )}
            </div>
          )}

          {/* Message Content */}
          <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwnMessage ? 'ml-auto' : ''}`}>
            {/* Sender name for group chats */}
            {!isOwnMessage && showAvatar && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 pl-3">
                {message.senderName}
              </div>
            )}

            {/* Message bubble */}
            <div
              className={`relative px-4 py-2 rounded-2xl ${
                isOwnMessage
                  ? 'bg-indigo-600 text-white ml-auto'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              } ${showAvatar ? '' : 'mt-1'}`}
            >
              {/* Reply to message */}
              {message.replyToMessageId && (
                <div className="mb-2 p-2 border-l-2 border-gray-300 dark:border-gray-600 bg-black bg-opacity-10 rounded text-sm">
                  <div className="text-xs opacity-75 mb-1">Replying to message</div>
                  {/* Would show original message content here */}
                </div>
              )}

              {/* Text content */}
              {message.content && (
                <div className="break-words">
                  {message.content}
                </div>
              )}

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment, idx) => {
                    const FileIcon = getFileIcon(attachment.fileType);
                    
                    return (
                      <div key={idx} className="flex items-center space-x-2 p-2 bg-black bg-opacity-10 rounded-lg">
                        <FileIcon className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs opacity-75">
                            {formatFileSize(attachment.fileSize)}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <a
                            href={attachment.file.secure_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-black hover:bg-opacity-20 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <a
                            href={attachment.file.secure_url}
                            download={attachment.fileName}
                            className="p-1 hover:bg-black hover:bg-opacity-20 rounded"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Message actions */}
              <div className={`absolute top-0 ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-2 py-1">
                  <button
                    onClick={() => setShowReactions(message.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Add reaction"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {/* Handle reply */}}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Reply"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="More actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Reactions popup */}
              {showReactions === message.id && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2 z-10">
                  <div className="flex space-x-2">
                    {['👍', '❤️', '😂', '😢', '😮', '😡'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(message.id, emoji)}
                        className="text-xl hover:scale-110 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* More actions menu */}
              {selectedMessage === message.id && (
                <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                  <button
                    onClick={() => handleCopyMessage(message.content)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </button>
                  {isOwnMessage && (
                    <>
                      <button
                        onClick={() => {/* Handle edit */}}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => {/* Handle delete */}}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 pl-3">
                {message.reactions.reduce((acc: any[], reaction) => {
                  const existing = acc.find(r => r.emoji === reaction.emoji);
                  if (existing) {
                    existing.count++;
                    existing.users.push(reaction.userName);
                  } else {
                    acc.push({
                      emoji: reaction.emoji,
                      count: 1,
                      users: [reaction.userName]
                    });
                  }
                  return acc;
                }, []).map((reaction, idx) => (
                  <button
                    key={idx}
                    className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-600"
                    title={reaction.users.join(', ')}
                  >
                    <span>{reaction.emoji}</span>
                    <span>{reaction.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Message status and time */}
            <div className={`flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400 ${
              isOwnMessage ? 'justify-end' : 'justify-start'
            }`}>
              <span>
                {format(new Date(message.createdAt), 'HH:mm')}
              </span>
              {message.isEdited && (
                <span className="ml-1">(edited)</span>
              )}
              {message.isPinned && (
                <Pin className="w-3 h-3 ml-1" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4">
      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {loading && <Loader2 className="w-6 h-6 animate-spin text-gray-400" />}
        </div>
      )}

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <p className="text-lg font-medium mb-2">No messages yet</p>
          <p className="text-sm">Start the conversation by sending a message</p>
        </div>
      ) : (
        <div className="space-y-0">
          {messages.map((message, index) => renderMessage(message, index))}
        </div>
      )}

      {/* Click outside to close menus */}
      {(selectedMessage || showReactions) && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => {
            setSelectedMessage(null);
            setShowReactions(null);
          }}
        />
      )}
    </div>
  );
}