// components/Employee/Chat/RecentChats.tsx
"use client";
import { IChat } from '@/types/chat';
import ChatCard from './ChatCard';
import { MessageSquare } from 'lucide-react';

interface RecentChatsProps {
  chats: IChat[];
  onChatSelect: (chatId: string) => void;
}

export function RecentChats({ chats, onChatSelect }: RecentChatsProps) {
  // Add safety check for undefined chats
  if (!chats || !Array.isArray(chats)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Recent Chats
          </h3>
          <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
            View all
          </button>
        </div>
        
        <div className="text-center py-8">
          <div className="animate-pulse">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">Loading recent chats...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Recent Chats
        </h3>
        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
          View all
        </button>
      </div>
      
      {chats.length > 0 ? (
        <div className="space-y-3">
          {chats.slice(0, 5).map(chat => (
            <ChatCard
              key={chat.id}
              chat={chat}
              onSelect={() => onChatSelect(chat.id)}
              isSelected={false}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No recent chats</p>
        </div>
      )}
    </div>
  );
}