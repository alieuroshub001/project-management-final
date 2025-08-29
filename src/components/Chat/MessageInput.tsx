// components/Employee/Chat/MessageInput.tsx
"use client";
import { useState, useRef } from 'react';
import { IMessageSendRequest, ICloudinaryFile } from '@/types/chat';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Image,
  X,
  File,
  Loader2
} from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (messageData: IMessageSendRequest) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<ICloudinaryFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const commonEmojis = ['😀', '😂', '❤️', '👍', '👎', '😢', '😮', '😡', '🎉', '🔥'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && attachments.length === 0) return;
    if (disabled || uploading) return;

    onSendMessage({
      chatId: '', // Will be set by parent component
      content: message.trim(),
      messageType: attachments.length > 0 ? 'image' : 'text', // Simplified for demo
      cloudinaryAttachments: attachments
    });

    setMessage('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0 || uploading) return;

    setUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setAttachments(prev => [...prev, ...data.files]);
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (publicId: string) => {
    setAttachments(prev => prev.filter(file => file.public_id !== publicId));
  };

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  return (
    <div className="space-y-3">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          {attachments.map((file) => (
            <div key={file.public_id} className="relative group">
              {file.resource_type === 'image' ? (
                <div className="relative">
                  <img
                    src={file.secure_url}
                    alt={file.original_filename}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeAttachment(file.public_id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="relative flex items-center p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <File className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-20">
                    {file.original_filename}
                  </span>
                  <button
                    onClick={() => removeAttachment(file.public_id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled || uploading}
            rows={1}
            className="w-full px-4 py-3 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
          
          {/* Input Actions */}
          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            {/* File Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </button>

            {/* Emoji Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Smile className="w-4 h-4" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="grid grid-cols-5 gap-2">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!message.trim() && attachments.length === 0) || disabled || uploading}
          className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
      </form>
    </div>
  );
}