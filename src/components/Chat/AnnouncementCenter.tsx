// components/Chat/AnnouncementCenter.tsx
"use client";
import { Megaphone, Pin, Calendar, Users } from 'lucide-react';

export function AnnouncementCenter() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h2>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Mark All Read
        </button>
      </div>

      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Announcements</h3>
        <p className="text-gray-500 dark:text-gray-400">Check back later for company updates and announcements.</p>
      </div>
    </div>
  );
}