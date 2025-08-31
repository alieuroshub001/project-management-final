// components/Chat/EnhancedChatModule.tsx
"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ChatDashboard from './ChatDashboard';
import WhatsAppChatList from './WhatsAppChatList';
import ChatWindow from './ChatWindow';
import { ChatSettings } from './ChatSettings';
import { AnnouncementCenter } from './AnnouncementCenter';
import { useChat } from '@/hooks/useChat';
import {
  MessageSquare,
  Users,
  Settings,
  Megaphone,
  Plus,
  Search,
  ArrowLeft,
  Wifi,
  WifiOff,
  RotateCcw
} from 'lucide-react';

type TabType = 'dashboard' | 'chats' | 'announcements' | 'settings';

interface EnhancedChatModuleProps {
  initialTab?: TabType;
  selectedChatId?: string;
}

export default function EnhancedChatModule({ 
  initialTab = 'chats', 
  selectedChatId 
}: EnhancedChatModuleProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentChatId, setCurrentChatId] = useState<string | null>(selectedChatId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {
    connectionStatus,
    refreshChat
  } = useChat(currentChatId || '');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    if (isMobile) {
      // On mobile, hide the chat list when selecting a chat
      setActiveTab('chats');
    }
  };

  const handleBackFromChat = () => {
    setCurrentChatId(null);
    setShowChatInfo(false);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
      case 'reconnecting':
        return <RotateCcw className="w-4 h-4 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <Wifi className="w-4 h-4" />;
    }
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
          <WhatsAppChatList 
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
          <WhatsAppChatList 
            searchQuery={searchQuery}
            onChatSelect={handleChatSelect}
            selectedChatId={currentChatId}
          />
        );
    }
  };

  // Mobile layout: Show chat window full screen when chat is selected
  if (isMobile && currentChatId) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <ChatWindow
          chatId={currentChatId}
          onBack={handleBackFromChat}
          onShowInfo={() => setShowChatInfo(true)}
        />
      </div>
    );
  }

  // Desktop layout: Show chat list and chat window side by side
  if (!isMobile && currentChatId) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Chat List Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header with connection status */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1 ${getConnectionStatusColor()}`}>
                  {getConnectionStatusIcon()}
                  <span className="text-xs font-medium capitalize">
                    {connectionStatus}
                  </span>
                </div>
                {connectionStatus === 'disconnected' && (
                  <button
                    onClick={refreshChat}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-hidden">
            <WhatsAppChatList 
              searchQuery={searchQuery}
              onChatSelect={handleChatSelect}
              selectedChatId={currentChatId}
            />
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          <ChatWindow
            chatId={currentChatId}
            onBack={handleBackFromChat}
            onShowInfo={() => setShowChatInfo(true)}
          />
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chat & Communications</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Stay connected with your team and manage conversations
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                connectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : connectionStatus === 'disconnected'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
              }`}>
                {getConnectionStatusIcon()}
                <span className="font-medium capitalize">{connectionStatus}</span>
              </div>

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
    </div>
  );
}