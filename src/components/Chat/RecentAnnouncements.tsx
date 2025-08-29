// components/Employee/Chat/RecentAnnouncements.tsx
import { IAnnouncement } from '@/types/chat';
import { Megaphone, Pin, Calendar } from 'lucide-react';

interface RecentAnnouncementsProps {
  announcements: IAnnouncement[];
}

export function RecentAnnouncements({ announcements }: RecentAnnouncementsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Megaphone className="w-5 h-5 mr-2" />
          Recent Announcements
        </h3>
        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
          View all
        </button>
      </div>
      
      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.slice(0, 3).map(announcement => (
            <div key={announcement.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {announcement.title}
                </h4>
                {announcement.isPinned && (
                  <Pin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {announcement.content}
              </p>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3 mr-1" />
                <span>
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </span>
                <span className="mx-2">•</span>
                <span>by {announcement.createdByName}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No recent announcements</p>
        </div>
      )}
    </div>
  );
}