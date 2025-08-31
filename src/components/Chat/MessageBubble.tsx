// components/Chat/MessageBubble.tsx
"use client";
import { useState, useRef } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  IMessageBubble, 
  IMessageAttachment, 
  IMessageReaction,
  MessageStatus 
} from '@/types/chat';
import {
  Check,
  CheckCheck,
  Clock,
  MoreVertical,
  Reply,
  Copy,
  Forward,
  Edit3,
  Trash2,
  Pin,
  Download,
  Eye,
  Heart,
  ThumbsUp,
  Smile
} from 'lucide-react';
import Image from 'next/image';

interface MessageBubbleProps {
  message: IMessageBubble;
  showSender?: boolean;
  isGrouped?: boolean;
  onReply?: (message: IMessageBubble) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onForward?: (message: IMessageBubble) => void;
}

const COMMON_EMOJIS = ['❤️', '👍', '👎', '😂', '😮', '😢', '😡'];

export default function MessageBubble({
  message,
  showSender = false,
  isGrouped = false,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onForward
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const actionsRef = useRef<HTMLDivElement>(null);

  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    if (now.toDateString() === messageDate.toDateString()) {
      return format(messageDate, 'HH:mm');
    } else if (now.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return format(messageDate, 'EEE HH:mm');
    } else {
      return format(messageDate, 'dd/MM/yyyy HH:mm');
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const renderAttachment = (attachment: IMessageAttachment) => {
    const isImage = attachment.file.resource_type === 'image';
    const isVideo = attachment.file.resource_type === 'video';
    
    if (isImage) {
      return (
        <div key={attachment.id} className="relative group">
          <Image
            src={attachment.file.secure_url}
            alt={attachment.fileName}
            width={300}
            height={200}
            className="rounded-lg max-w-xs object-cover cursor-pointer hover:opacity-95"
            onClick={() => window.open(attachment.file.secure_url, '_blank')}
          />
          <button
            onClick={() => window.open(attachment.file.secure_url, '_blank')}
            className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Eye className="w-4 h-4 text-white" />
          </button>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div key={attachment.id} className="relative">
          <video
            src={attachment.file.secure_url}
            controls
            className="rounded-lg max-w-xs"
            poster={attachment.thumbnailUrl}
          />
        </div>
      );
    }

    return (
      <div key={attachment.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg max-w-xs">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
          <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {attachment.fileName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {(attachment.fileSize / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
        <button
          onClick={() => window.open(attachment.file.secure_url, '_blank')}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderReactions = (reactions: IMessageReaction[]) => {
    if (!reactions || reactions.length === 0) return null;

    const reactionGroups = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {} as Record<string, IMessageReaction[]>);

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(reactionGroups).map(([emoji, reactionList]) => (
          <button
            key={emoji}
            onClick={() => onReaction?.(message.id, emoji)}
            className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span>{emoji}</span>
            <span className="text-gray-600 dark:text-gray-400">{reactionList.length}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-xs md:max-w-md lg:max-w-lg ${message.isOwn ? 'order-2' : 'order-1'}`}>
        {/* Sender info for groups */}
        {showSender && !message.isOwn && (
          <div className="flex items-center space-x-2 mb-1 ml-2">
            {message.senderAvatar && (
              <Image
                src={message.senderAvatar}
                alt={message.senderName || 'User'}
                width={20}
                height={20}
                className="rounded-full"
              />
            )}
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              {message.senderName}
            </span>
          </div>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className="mb-2 ml-2">
            <div className="border-l-3 border-indigo-500 pl-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-r-lg">
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                {message.replyTo.senderName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {message.replyTo.content}
              </p>
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`relative px-4 py-2 rounded-2xl ${
            message.isOwn
              ? 'bg-indigo-600 text-white rounded-br-md'
              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-md'
          } ${isGrouped && !showSender ? (message.isOwn ? 'rounded-tr-md' : 'rounded-tl-md') : ''}`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {/* Forward indicator */}
          {message.isForwarded && (
            <div className={`text-xs mb-1 ${message.isOwn ? 'text-indigo-200' : 'text-gray-500'}`}>
              <Forward className="w-3 h-3 inline mr-1" />
              Forwarded
            </div>
          )}

          {/* Message content */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none text-sm"
                rows={2}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map(renderAttachment)}
                </div>
              )}

              {/* Message footer */}
              <div className={`flex items-center justify-end space-x-1 mt-1 ${
                message.isOwn ? 'text-indigo-200' : 'text-gray-500'
              }`}>
                <span className="text-xs">
                  {formatTime(message.timestamp)}
                </span>
                {message.isEdited && (
                  <span className="text-xs">edited</span>
                )}
                {message.isOwn && getStatusIcon(message.status)}
              </div>
            </>
          )}

          {/* Action buttons */}
          {showActions && !isEditing && (
            <div className={`absolute top-0 ${message.isOwn ? '-left-8' : '-right-8'} flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                <Smile className="w-3 h-3" />
              </button>
              <button
                onClick={() => onReply?.(message)}
                className="p-1 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                <Reply className="w-3 h-3" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
                
                {showActions && (
                  <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <button
                      onClick={() => navigator.clipboard.writeText(message.content)}
                      className="w-full px-3 py-1 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <Copy className="w-3 h-3 mr-2" />
                      Copy
                    </button>
                    <button
                      onClick={() => onForward?.(message)}
                      className="w-full px-3 py-1 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <Forward className="w-3 h-3 mr-2" />
                      Forward
                    </button>
                    {message.isOwn && (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="w-full px-3 py-1 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <Edit3 className="w-3 h-3 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete?.(message.id)}
                          className="w-full px-3 py-1 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick reactions */}
          {showReactions && (
            <div className={`absolute ${message.isOwn ? '-left-8' : '-right-8'} top-8 flex space-x-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg border border-gray-200 dark:border-gray-700 z-50`}>
              {COMMON_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReaction?.(message.id, emoji);
                    setShowReactions(false);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reactions */}
        {renderReactions(message.reactions || [])}
      </div>
    </div>
  );
}