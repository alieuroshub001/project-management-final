// components/Chat/SafeChatModule.tsx
"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type TabType = 'dashboard' | 'chats' | 'announcements' | 'settings';

interface SafeChatModuleProps {
  initialTab?: TabType;
  selectedChatId?: string;
}

// Simple Chat List Component
const SimpleChatList = ({ onChatSelect }: { onChatSelect: (id: string) => void }) => {
  const mockChats = [
    { id: '1', name: 'John Doe', lastMessage: 'Hello there!', unreadCount: 2 },
    { id: '2', name: 'Team Chat', lastMessage: 'Meeting at 3pm', unreadCount: 0 },
    { id: '3', name: 'Project Alpha', lastMessage: 'Updates ready', unreadCount: 1 },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversations</h3>
      {mockChats.map(chat => (
        <div
          key={chat.id}
          onClick={() => onChatSelect(chat.id)}
          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {chat.name.charAt(0)}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{chat.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{chat.lastMessage}</p>
            </div>
          </div>
          {chat.unreadCount > 0 && (
            <div className="bg-indigo-500 text-white text-xs rounded-full px-2 py-1">
              {chat.unreadCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Simple Chat Window Component
const SimpleChatWindow = ({ chatId, onBack }: { chatId: string; onBack: () => void }) => {
  const mockMessages = [
    { id: '1', content: 'Hello there!', isOwn: false, timestamp: new Date() },
    { id: '2', content: 'Hi! How are you?', isOwn: true, timestamp: new Date() },
    { id: '3', content: 'I\'m doing great, thanks!', isOwn: false, timestamp: new Date() },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chat {chatId}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mockMessages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.isOwn
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SafeChatModule({ 
  initialTab = 'chats', 
  selectedChatId 
}: SafeChatModuleProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentChatId, setCurrentChatId] = useState<string | null>(selectedChatId || null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      setCurrentChatId(selectedChatId);
      setActiveTab('chats');
    }
  }, [selectedChatId]);

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const handleBackFromChat = () => {
    setCurrentChatId(null);
  };

  // Mobile layout: Show chat window full screen when chat is selected
  if (isMobile && currentChatId) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <SimpleChatWindow chatId={currentChatId} onBack={handleBackFromChat} />
      </div>
    );
  }

  // Desktop layout: Show chat list and chat window side by side
  if (!isMobile && currentChatId) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
          <SimpleChatList onChatSelect={handleChatSelect} />
        </div>
        <div className="flex-1">
          <SimpleChatWindow chatId={currentChatId} onBack={handleBackFromChat} />
        </div>
      </div>
    );
  }

  // Default layout: Show tab navigation and content
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Chat & Communications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Stay connected with your team
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {['chats', 'dashboard', 'announcements', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="min-h-[600px]">
          {activeTab === 'chats' && (
            <SimpleChatList onChatSelect={handleChatSelect} />
          )}
          {activeTab === 'dashboard' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Chat statistics will appear here</p>
            </div>
          )}
          {activeTab === 'announcements' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Company announcements will appear here</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Chat preferences will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}