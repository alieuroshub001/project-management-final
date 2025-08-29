// components/Employee/Chat/MessageItem.tsx
"use client";
import { useState } from 'react';
import { IMessage } from '@/types/chat';
import { formatDate, formatDistanceToNow } from '@/utils/dateUtils';
import {
  MoreVertical,
  Reply,
  Edit,
  Trash2,
  Copy,
  Forward,
  Smile,
  Pin,
  Download,
  Eye,
  File
} from 'lucide-react';

interface MessageItemProps {
  message: IMessage;
  isOwn: boolean;
  showSender: boolean;
}

export default function MessageItem({ message, isOwn, showSender }: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const formatMessageTime = (date: Date | string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return formatDate(messageDate);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    return '📎';
  };

  const handleReaction = (emoji: string) => {
    // Handle adding reaction
    console.log('Add reaction:', emoji);
    setShowReactions(false);
  };

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Sender info */}
        {showSender && !isOwn && (
          <div className="flex items-center space-x-2 mb-1 px-3">
            {message.senderProfileImage?.secure_url ? (
              <img
                src={message.senderProfileImage.secure_url}
                alt={message.senderName}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {message.senderName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {message.senderName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatMessageTime(message.createdAt)}
            </span>
          </div>
        )}

        {/* Message content */}
        <div
          className={`relative rounded-lg px-4 py-2 ${
            isOwn
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm'
          }`}
        >
          {/* Reply context */}
          {message.replyTo && (
            <div className={`mb-2 p-2 rounded border-l-4 ${
              isOwn 
                ? 'border-indigo-300 bg-indigo-700' 
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
            }`}>
              <p className={`text-xs ${isOwn ? 'text-indigo-200' : 'text-gray-600 dark:text-gray-400'}`}>
                Replying to {message.replyTo.senderName}
              </p>
              <p className={`text-sm ${isOwn ? 'text-indigo-100' : 'text-gray-800 dark:text-gray-300'}`}>
                {message.replyTo.content.slice(0, 100)}
                {message.replyTo.content.length > 100 && '...'}
              </p>
            </div>
          )}

          {/* Forward context */}
          {message.forwardedFrom && (
            <div className={`mb-2 text-xs italic ${
              isOwn ? 'text-indigo-200' : 'text-gray-600 dark:text-gray-400'
            }`}>
              Forwarded from {message.forwardedFrom.originalSenderName}
            </div>
          )}

          {/* Message text */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`p-3 rounded-lg border ${
                    isOwn
                      ? 'bg-indigo-700 border-indigo-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {attachment.file.resource_type === 'image' ? (
                      <div className="flex-1">
                        <img
                          src={attachment.file.secure_url}
                          alt={attachment.fileName}
                          className="max-w-full h-auto rounded"
                          style={{ maxHeight: '200px' }}
                        />
                        <p className={`text-xs mt-1 ${
                          isOwn ? 'text-indigo-200' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {attachment.fileName}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className={`p-2 rounded ${
                          isOwn
                            ? 'bg-indigo-600'
                            : 'bg-gray-200 dark:bg-gray-600'
                        }`}>
                          <File className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isOwn ? 'text-white' : 'text-gray-900 dark:text-white'
                          }`}>
                            {attachment.fileName}
                          </p>
                          <p className={`text-xs ${
                            isOwn ? 'text-indigo-200' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => window.open(attachment.file.secure_url, '_blank')}
                            className={`p-1 rounded hover:bg-opacity-80 ${
                              isOwn
                                ? 'hover:bg-indigo-500'
                                : 'hover:bg-gray-300 dark:hover:bg-gray-500'
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={attachment.file.secure_url}
                            download={attachment.fileName}
                            className={`p-1 rounded hover:bg-opacity-80 ${
                              isOwn
                                ? 'hover:bg-indigo-500'
                                : 'hover:bg-gray-300 dark:hover:bg-gray-500'
                            }`}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message status */}
          {isOwn && (
            <div className="flex justify-end mt-1">
              <span className="text-xs text-indigo-200">
                {message.deliveryStatus === 'read' && '✓✓'}
                {message.deliveryStatus === 'delivered' && '✓'}
                {message.deliveryStatus === 'sent' && '→'}
              </span>
            </div>
          )}

          {/* Edit indicator */}
          {message.isEdited && (
            <span className={`text-xs italic ${
              isOwn ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'
            }`}>
              (edited)
            </span>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-3">
            {Object.entries(
              message.reactions.reduce((acc, reaction) => {
                acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${
                  isOwn
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                } hover:bg-opacity-80`}
              >
                <span>{emoji}</span>
                <span className="ml-1">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Time for own messages */}
        {isOwn && showSender && (
          <div className="text-right mt-1 px-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatMessageTime(message.createdAt)}
            </span>
          </div>
        )}
      </div>

      {/* Actions menu */}
      <div className={`relative ${isOwn ? 'order-1 mr-2' : 'order-2 ml-2'} opacity-0 group-hover:opacity-100 transition-opacity`}>
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showActions && (
          <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50`}>
            <button
              onClick={() => setShowReactions(true)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <Smile className="w-4 h-4 mr-2" />
              React
            </button>
            <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
              <Reply className="w-4 h-4 mr-2" />
              Reply
            </button>
            <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
              <Forward className="w-4 h-4 mr-2" />
              Forward
            </button>
            <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </button>
            {message.isPinned ? (
              <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                <Pin className="w-4 h-4 mr-2" />
                Unpin
              </button>
            ) : (
              <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                <Pin className="w-4 h-4 mr-2" />
                Pin
              </button>
            )}
            {isOwn && (
              <>
                <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reactions picker */}
        {showReactions && (
          <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50`}>
            <div className="flex space-x-1">
              {commonReactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}