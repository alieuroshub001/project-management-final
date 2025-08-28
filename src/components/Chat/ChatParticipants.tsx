// components/Chat/ChatParticipants.tsx
"use client";
import { useState } from 'react';
import { IChatParticipant, ParticipantRole } from '@/types/chat';
import {
  Crown,
  Shield,
  User,
  MoreVertical,
  UserMinus,
  Settings,
  Volume,
  VolumeX
} from 'lucide-react';

interface ChatParticipantsProps {
  participants: IChatParticipant[];
  chatId: string;
  currentUserRole: ParticipantRole;
  onUpdate: () => void;
}

export default function ChatParticipants({
  participants,
  chatId,
  currentUserRole,
  onUpdate
}: ChatParticipantsProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const getRoleIcon = (role: ParticipantRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-green-500" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const canManageParticipant = (participantRole: ParticipantRole) => {
    if (currentUserRole === 'owner') return true;
    if (currentUserRole === 'admin' && participantRole !== 'owner') return true;
    return false;
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-2 p-4">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {participant.userAvatar ? (
                <img
                  src={participant.userAvatar.secure_url}
                  alt={participant.userName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {participant.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {participant.userName}
                  </p>
                  {getRoleIcon(participant.role)}
                  {participant.isMuted && (
                    <VolumeX className="w-3 h-3 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {participant.role}
                </p>
              </div>
            </div>

            {canManageParticipant(participant.role) && (
              <div className="relative">
                <button
                  onClick={() => setSelectedUser(selectedUser === participant.id ? null : participant.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {selectedUser === participant.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                    <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </button>
                    <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                      {participant.isMuted ? <Volume /> : <VolumeX />}
                      <span className="ml-2">{participant.isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>
                    <button className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center">
                      <UserMinus className="w-4 h-4 mr-2" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
