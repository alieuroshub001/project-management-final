// components/Employee/Chat/ChatModule.tsx
"use client";
import { useState, useEffect } from 'react';
import ChatDashboard from './ChatDashboard';
import ChatList from './ChatList';
import ChatDetails from './ChatDetails';
import {ChatSettings} from './ChatSettings';
import {AnnouncementCenter} from './AnnouncementCenter';
import {
  MessageSquare,
  Users,
  Settings,
  Megaphone,
  Plus,
  Search
} from 'lucide-react';

type TabType = 'dashboard' | 'chats' | 'announcements' | 'settings';

interface ChatModuleProps {
  initialTab?: TabType;
  selectedChatId?: string;
}

export default function ChatModule({ initialTab = 'dashboard', selectedChatId }: ChatModuleProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentChatId, setCurrentChatId] = useState<string | null>(selectedChatId || null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (selectedChatId) {
      setCurrentChatId(selectedChatId);
      setActiveTab('chats');
    }
  }, [selectedChatId]);

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: MessageSquare,
      description: 'Chat overview and stats'
    },
    { 
      id: 'chats', 
      label: 'Messages', 
      icon: Users,
      description: 'All conversations'
    },
    { 
      id: 'announcements', 
      label: 'Announcements', 
      icon: Megaphone,
      description: 'Company announcements'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      description: 'Chat preferences'
    }
  ];

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    // Don't change tab when selecting chat - stay on current view
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setActiveTab('chats');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ChatDashboard 
            selectedChatId={currentChatId}
            onChatSelect={handleChatSelect}
          />
        );
      case 'chats':
        return (
          <ChatList 
            searchQuery={searchQuery}
            onChatSelect={handleChatSelect}
            selectedChatId={currentChatId}
          />
        );
      case 'announcements':
        return <AnnouncementCenter />;
      case 'settings':
        return <ChatSettings />;
      default:
        return (
          <ChatDashboard 
            selectedChatId={currentChatId}
            onChatSelect={handleChatSelect}
          />
        );
    }
  };

  // Show chat details if a specific chat is selected
  if (currentChatId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={() => setCurrentChatId(null)}
            className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {activeTab === 'dashboard' ? 'Dashboard' : 'Messages'}
          </button>
        </div>
        
        <ChatDetails 
          chatId={currentChatId}
          onBack={() => setCurrentChatId(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chat & Communications</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Stay connected with your team and manage conversations
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Global Search - only show on chats tab */}
            {activeTab === 'chats' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
                />
              </div>
            )}
            
            <button
              onClick={handleNewChat}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`group flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <IconComponent className={`w-5 h-5 mr-2 ${
                  activeTab === tab.id 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
}