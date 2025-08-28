// components/Chat/ChatModule.tsx
"use client";
import { useState, useEffect } from 'react';
import { IChat, IChatWithDetails } from '@/types/chat';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import ChatSettings from './ChatSettings';
import NewChatModal from './NewChatModal';
import { MessageSquare, Settings, Plus } from 'lucide-react';

export default function ChatModule() {
  const [chats, setChats] = useState<IChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<IChatWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'settings'>('chats');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chat');
      const data = await response.json();
      
      if (response.ok) {
        setChats(data.data.chats);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatDetails = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedChat(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch chat details:', error);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const handleChatSelect = (chat: IChat) => {
    fetchChatDetails(chat.id);
  };

  const handleNewChat = async (chatData: any) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatData)
      });

      if (response.ok) {
        await fetchChats();
        setShowNewChatModal(false);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <MessageSquare className="w-6 h-6 mr-2" />
              Chat
            </h1>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'chats'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-1" />
              Settings
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chats' ? (
            <ChatSidebar
              chats={chats}
              selectedChat={selectedChat}
              onChatSelect={handleChatSelect}
              loading={loading}
              onRefresh={fetchChats}
            />
          ) : (
            <ChatSettings />
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            onChatUpdate={() => {
              fetchChatDetails(selectedChat.id);
              fetchChats(); // Refresh sidebar
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
                Select a chat to start messaging
              </h2>
              <p className="text-gray-400 dark:text-gray-500 mb-6">
                Choose from your existing conversations or create a new one
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onCreateChat={handleNewChat}
      />
    </div>
  );
}