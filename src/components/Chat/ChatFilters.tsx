// components/Employee/Chat/ChatFilters.tsx
"use client";
import { ChatType } from '@/types/chat';
import { X, Filter } from 'lucide-react';

interface ChatFiltersProps {
  filters: {
    chatType: ChatType[];
    hasUnread: boolean;
    isPinned: boolean;
    isArchived: boolean;
  };
  onFilterChange: (filters: {
    chatType: ChatType[];
    hasUnread: boolean;
    isPinned: boolean;
    isArchived: boolean;
  }) => void;
}

export default function ChatFilters({ filters, onFilterChange }: ChatFiltersProps) {
  const chatTypeOptions: { value: ChatType; label: string }[] = [
    { value: 'direct', label: 'Direct Messages' },
    { value: 'group', label: 'Group Chats' },
    { value: 'channel', label: 'Channels' },
    { value: 'announcement', label: 'Announcements' }
  ];

  const handleChatTypeChange = (chatType: ChatType, checked: boolean) => {
    const newChatTypes = checked 
      ? [...filters.chatType, chatType]
      : filters.chatType.filter(t => t !== chatType);
    
    onFilterChange({
      ...filters,
      chatType: newChatTypes
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      chatType: [],
      hasUnread: false,
      isPinned: false,
      isArchived: false
    });
  };

  const hasActiveFilters = filters.chatType.length > 0 || 
                          filters.hasUnread || 
                          filters.isPinned || 
                          filters.isArchived;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filter Chats
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Type Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Chat Type</h4>
          <div className="space-y-2">
            {chatTypeOptions.map(option => (
              <label key={option.value} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.chatType.includes(option.value)}
                  onChange={(e) => handleChatTypeChange(option.value, e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Status</h4>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.hasUnread}
                onChange={(e) => onFilterChange({ ...filters, hasUnread: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                Has Unread Messages
              </span>
            </label>
            
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.isPinned}
                onChange={(e) => onFilterChange({ ...filters, isPinned: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                Pinned Chats
              </span>
            </label>
          </div>
        </div>

        {/* Archive Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Archive</h4>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.isArchived}
                onChange={(e) => onFilterChange({ ...filters, isArchived: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                Include Archived
              </span>
            </label>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Filters</h4>
          <div className="space-y-2">
            <button
              onClick={() => onFilterChange({ ...filters, hasUnread: true, chatType: [] })}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Unread Only
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, chatType: ['direct'], hasUnread: false })}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              DMs Only
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, chatType: ['group', 'channel'], hasUnread: false })}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Groups & Channels
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {filters.chatType.map(type => (
              <span key={type} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                {chatTypeOptions.find(t => t.value === type)?.label}
                <button
                  onClick={() => handleChatTypeChange(type, false)}
                  className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {filters.hasUnread && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                Unread Messages
                <button
                  onClick={() => onFilterChange({ ...filters, hasUnread: false })}
                  className="ml-1 hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.isPinned && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                Pinned
                <button
                  onClick={() => onFilterChange({ ...filters, isPinned: false })}
                  className="ml-1 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.isArchived && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
                Archived
                <button
                  onClick={() => onFilterChange({ ...filters, isArchived: false })}
                  className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}