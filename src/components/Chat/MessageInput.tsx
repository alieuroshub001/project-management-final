// components/Chat/MessageInput.tsx
"use client";
import { useState, useRef, useCallback, useEffect } from 'react';
import { IMessageSendRequest, ICloudinaryFile, IMessageBubble } from '@/types/chat';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Image as ImageIcon,
  X,
  File,
  Loader2,
  Camera,
  FileText,
  Reply
} from 'lucide-react';
import Image from 'next/image';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  replyTo?: IMessageBubble | null;
  onCancelReply?: () => void;
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙'],
  'Gestures': ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👏', '🙌', '👐', '🤲'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Objects': ['🔥', '💯', '✨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🏅', '⭐', '🌟', '💫', '⚡', '💥', '💢', '💨', '💤', '💦', '💧']
};

export default function MessageInput({ 
  onSendMessage, 
  onTyping,
  disabled = false,
  placeholder = "Type a message...",
  replyTo,
  onCancelReply
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<string>('Smileys');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, []);

  // Handle message submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && attachments.length === 0) || disabled || uploading) return;

    try {
      setUploading(true);
      await onSendMessage(message.trim(), attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
      setShowEmojiPicker(false);
      setShowAttachmentMenu(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setUploading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle message change and typing
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
    onTyping?.();
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
      setShowAttachmentMenu(false);
    }
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Insert emoji
  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  // Get file type icon
  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />;
    } else {
      return <FileText className="w-4 h-4" />;
    }
  };

  // Get attachment preview
  const getAttachmentPreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      return (
        <Image
          src={url}
          alt={file.name}
          width={40}
          height={40}
          className="rounded object-cover"
          onLoad={() => URL.revokeObjectURL(url)}
        />
      );
    }
    return (
      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center">
        {getFileTypeIcon(file)}
      </div>
    );
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      {/* Reply Preview */}
      {replyTo && (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-indigo-500">
          <Reply className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {replyTo.senderName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {replyTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative flex items-center space-x-2 bg-white dark:bg-gray-600 p-2 rounded-lg border border-gray-200 dark:border-gray-500 group"
            >
              {getAttachmentPreview(file)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 max-h-80 overflow-hidden"
        >
          {/* Category tabs */}
          <div className="flex space-x-2 mb-3 border-b border-gray-200 dark:border-gray-600">
            {Object.keys(EMOJI_CATEGORIES).map(category => (
              <button
                key={category}
                onClick={() => setSelectedEmojiCategory(category)}
                className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                  selectedEmojiCategory === category
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
            {EMOJI_CATEGORIES[selectedEmojiCategory as keyof typeof EMOJI_CATEGORIES]?.map((emoji) => (
              <button
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="text-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <div
          ref={attachmentMenuRef}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2"
        >
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center space-x-3 w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Camera className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">Photos & Videos</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-3 w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">Documents</span>
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx"
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*"
      />

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
          disabled={disabled || uploading}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Message Input Container */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || uploading}
            className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            style={{ minHeight: '48px', maxHeight: '120px' }}
            rows={1}
          />
          
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled || uploading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={disabled || uploading || (!message.trim() && attachments.length === 0)}
          className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}