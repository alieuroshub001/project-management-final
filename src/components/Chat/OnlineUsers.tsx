// components/Employee/Chat/OnlineUsers.tsx
import { ISearchableUser } from '@/types/chat';
import { Users, Circle } from 'lucide-react';

interface OnlineUsersProps {
  users: ISearchableUser[];
}

export function OnlineUsers({ users }: OnlineUsersProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <Users className="w-5 h-5 mr-2" />
        Online Now ({users.length})
      </h3>
      
      {users.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {users.map(user => (
            <div key={user.id} className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {user.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                {user.department && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.department}
                  </p>
                )}
              </div>
              <Circle className="w-2 h-2 text-green-400 fill-current" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No users online</p>
        </div>
      )}
    </div>
  );
}