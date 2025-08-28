// components/Chat/ChatInput.tsx
"use client";
import { useState, useRef, KeyboardEvent } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  BarChart3,
  Megaphone,
  X,
  FileText,
  Loader2
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message..."
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '👍', '👎', '👌', '🤏', '✌️', '🤞', '🤟', '🤘',
    '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋'
  ];

  const handleSubmit = () => {
    if (!message.trim() && attachments.length === 0) return;
    if (disabled || uploading) return;

    onSendMessage(message, attachments);
    setMessage('');
    setAttachments([]);
    setShowActions(false);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        textarea.focus();
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 space-y-3">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-2"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={() => removeAttachment(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-2">
        {/* Quick Actions */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Quick actions"
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          {showActions && (
            <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[150px] z-10">
              <button
                onClick={() => {
                  setShowActions(false);
                  // Handle create poll
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Create Poll
              </button>
              <button
                onClick={() => {
                  setShowActions(false);
                  // Handle create announcement
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <Megaphone className="w-4 h-4 mr-2" />
                Announcement
              </button>
            </div>
          )}
        </div>

        {/* File Attachment */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />

          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
            title="Add emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || uploading || (!message.trim() && attachments.length === 0)}
          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send message"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-10">
          <div className="grid grid-cols-8 gap-2 max-w-xs">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => insertEmoji(emoji)}
                className="text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Click outside to close popups */}
      {(showEmojiPicker || showActions) && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => {
            setShowEmojiPicker(false);
            setShowActions(false);
          }}
        />
      )}
    </div>
  );
}