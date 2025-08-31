// components/Chat/SimpleNewChatModal.tsx
"use client";
import { useState } from 'react';
import { X, MessageCircle, Users } from 'lucide-react';

interface SimpleNewChatModalProps {
  onClose: () => void;
  onSuccess: (chatId: string) => void;
}

export default function SimpleNewChatModal({ onClose, onSuccess }: SimpleNewChatModalProps) {
  const [loading, setLoading] = useState(false);

  const handleCreateChat = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        onSuccess('demo-chat-id');
        setLoading(false);
      }, 1000);
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                New Chat
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleCreateChat}
                  disabled={loading}
                  className="flex flex-col items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <MessageCircle className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Direct Message
                  </span>
                </button>

                <button
                  onClick={handleCreateChat}
                  disabled={loading}
                  className="flex flex-col items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Users className="w-8 h-8 text-green-500 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Group Chat
                  </span>
                </button>
              </div>

              {loading && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Creating chat...</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}