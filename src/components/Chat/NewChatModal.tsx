// components/Chat/NewChatModal.tsx
"use client";
import { useState } from 'react';
import { ChatType } from '@/types/chat';
import { X, Users, Hash, Megaphone, MessageSquare } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (chatData: any) => void;
}

export default function NewChatModal({
  isOpen,
  onClose,
  onCreateChat
}: NewChatModalProps) {
  const [chatType, setChatType] = useState<ChatType>('direct');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const chatTypes = [
    {
      type: 'direct' as ChatType,
      label: 'Direct Message',
      description: 'Private conversation with one person',
      icon: MessageSquare
    },
    {
      type: 'group' as ChatType,
      label: 'Group Chat',
      description: 'Chat with multiple people',
      icon: Users
    },
    {
      type: 'channel' as ChatType,
      label: 'Channel',
      description: 'Public or semi-public channel',
      icon: Hash
    },
    {
      type: 'announcement' as ChatType,
      label: 'Announcements',
      description: 'Announcement-only channel',
      icon: Megaphone
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onCreateChat({
        name: name.trim(),
        type: chatType,
        description: description.trim() || undefined,
        participants: [],
        isPrivate: false
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Create New Chat
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chat Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chat Type
            </label>
            <div className="space-y-2">
              {chatTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <label
                    key={type.type}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      chatType === type.type
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="chatType"
                      value={type.type}
                      checked={chatType === type.type}
                      onChange={(e) => setChatType(e.target.value as ChatType)}
                      className="sr-only"
                    />
                    <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {type.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chat Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter chat name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter chat description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}