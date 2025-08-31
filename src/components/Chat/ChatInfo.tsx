// components/Employee/Chat/ChatInfo.tsx
"use client";
import { IChatWithDetails } from '@/types/chat';
import { X, Users, Settings, Bell, Archive, Trash2 } from 'lucide-react';

interface ChatInfoProps {
  chat: IChatWithDetails;
  onClose: () => void;
  onUpdate: () => void;
}

export function ChatInfo({ chat, onClose, onUpdate }: ChatInfoProps) {
  const activeParticipants = chat.participants.filter(p => p.isActive);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chat Info</h3>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Chat Details */}
        <div>
          <div className="text-center mb-4">
            {chat.avatar ? (
              <img
                src={chat.avatar.secure_url}
                alt={chat.name || 'Chat'}
                className="w-20 h-20 rounded-full mx-auto mb-3"
              />
            ) : (
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              {chat.name || 'Direct Message'}
            </h4>
            {chat.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {chat.description}
              </p>
            )}
          </div>
        </div>

        {/* Participants */}
        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Members ({activeParticipants.length})
          </h5>
          <div className="space-y-2">
            {activeParticipants.map(participant => (
              <div key={participant.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                {participant.profileImage ? (
                  <img
                    src={participant.profileImage.secure_url}
                    alt={participant.userName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {participant.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {participant.displayName || participant.userName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {participant.role}
                  </p>
                </div>
                {participant.isOnline && (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Actions */}
        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Actions</h5>
          <div className="space-y-2">
            <button className="w-full flex items-center px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Bell className="w-4 h-4 mr-3" />
              Mute Notifications
            </button>
            <button className="w-full flex items-center px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Archive className="w-4 h-4 mr-3" />
              Archive Chat
            </button>
            <button className="w-full flex items-center px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Settings className="w-4 h-4 mr-3" />
              Chat Settings
            </button>
            <button className="w-full flex items-center px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4 mr-3" />
              Delete Chat
            </button>
          </div>
        </div>

        {/* Shared Media */}
        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Shared Media</h5>
          {chat.sharedMedia && chat.sharedMedia.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {chat.sharedMedia.slice(0, 6).map(media => (
                <div key={media.id} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={media.file.secure_url}
                    alt={media.fileName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No shared media</p>
          )}
        </div>
      </div>
    </div>
  );
}
