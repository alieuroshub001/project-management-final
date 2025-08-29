// components/Employee/Chat/NewChatModal.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  IChatCreateRequest,
  IChatApiResponse,
  IChat,
  IUserSearchResult,
  ChatType 
} from '@/types/chat';
import {
  X,
  MessageCircle,
  Users,
  Hash,
  Search,
  Plus,
  UserPlus,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface NewChatModalProps {
  onClose: () => void;
  onSuccess: (chatId: string) => void;
}

export default function NewChatModal({ onClose, onSuccess }: NewChatModalProps) {
  const [chatType, setChatType] = useState<ChatType>('direct');
  const [chatName, setChatName] = useState('');
  const [chatDescription, setChatDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');

  const chatTypes = [
    {
      type: 'direct' as ChatType,
      label: 'Direct Message',
      description: 'Private conversation with one person',
      icon: MessageCircle
    },
    {
      type: 'group' as ChatType,
      label: 'Group Chat',
      description: 'Chat with multiple team members',
      icon: Users
    },
    {
      type: 'channel' as ChatType,
      label: 'Channel',
      description: 'Public channel for team communication',
      icon: Hash
    }
  ];

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/chat/search?type=users&query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (response.ok && data.data?.results?.users) {
        setSearchResults(data.data.results.users);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const validateForm = () => {
    if (chatType === 'direct' && selectedUsers.length !== 1) {
      setError('Please select exactly one person for direct message');
      return false;
    }
    if (chatType !== 'direct' && selectedUsers.length === 0) {
      setError('Please select at least one person to chat with');
      return false;
    }
    if ((chatType === 'group' || chatType === 'channel') && !chatName.trim()) {
      setError('Please enter a name for the chat');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const requestData: IChatCreateRequest = {
        chatType,
        participantIds: selectedUsers,
        ...(chatName && { name: chatName }),
        ...(chatDescription && { description: chatDescription })
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data: IChatApiResponse<IChat> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create chat');
      }

      if (data.data) {
        onSuccess(data.data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chat');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedUserNames = () => {
    return selectedUsers.map(userId => {
      const user = searchResults.find(u => u.id === userId);
      return user?.name || 'Unknown User';
    }).join(', ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Start New Chat
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Chat Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Chat Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {chatTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.type}
                    type="button"
                    onClick={() => setChatType(type.type)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      chatType === type.type
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <IconComponent className={`w-6 h-6 mb-2 ${
                      chatType === type.type 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-gray-400'
                    }`} />
                    <h3 className={`font-medium mb-1 ${
                      chatType === type.type 
                        ? 'text-indigo-900 dark:text-indigo-100' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {type.label}
                    </h3>
                    <p className={`text-sm ${
                      chatType === type.type 
                        ? 'text-indigo-700 dark:text-indigo-300' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Details */}
          {(chatType === 'group' || chatType === 'channel') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chat Name *
                </label>
                <input
                  type="text"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  placeholder={`Enter ${chatType} name...`}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={chatDescription}
                  onChange={(e) => setChatDescription(e.target.value)}
                  placeholder={`Describe the purpose of this ${chatType}...`}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {chatType === 'direct' ? 'Select Person' : 'Add Participants'}
            </label>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for team members..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
                  Selected ({selectedUsers.length}):
                </p>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  {getSelectedUserNames()}
                </p>
              </div>
            )}

            {/* Search Results */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              {searchResults.length > 0 ? (
                <div className="p-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleUserSelection(user.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedUsers.includes(user.id)
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </p>
                          {user.department && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {user.department}
                            </p>
                          )}
                        </div>
                        {selectedUsers.includes(user.id) && (
                          <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                            <Plus className="w-3 h-3 transform rotate-45" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery ? (
                    searchLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Searching...
                      </div>
                    ) : (
                      <div>
                        <UserPlus className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        <p>No users found matching "{searchQuery}"</p>
                      </div>
                    )
                  ) : (
                    <div>
                      <Search className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p>Start typing to search for team members</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedUsers.length === 0}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Creating...' : 'Start Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}