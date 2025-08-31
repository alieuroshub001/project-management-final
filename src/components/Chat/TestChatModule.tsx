// components/Chat/TestChatModule.tsx
"use client";
import { useState } from 'react';

type TabType = 'dashboard' | 'chats' | 'announcements' | 'settings';

interface TestChatModuleProps {
  initialTab?: TabType;
  selectedChatId?: string;
}

export default function TestChatModule({ 
  initialTab = 'chats', 
  selectedChatId 
}: TestChatModuleProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentChatId, setCurrentChatId] = useState<string | null>(selectedChatId || null);

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Test Chat Module</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Simple test version to isolate the error
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Active Tab: {activeTab}</h2>
          <p className="text-gray-600 dark:text-gray-400">Selected Chat: {currentChatId || 'None'}</p>
          
          <div className="mt-4 space-x-4">
            <button
              onClick={() => setActiveTab('chats')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Chats
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Dashboard
            </button>
            <button
              onClick={() => handleChatSelect('test-chat-1')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Select Test Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}