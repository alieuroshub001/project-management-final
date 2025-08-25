"use client";
import { useState } from 'react';

export default function Calendar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Calendar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Calendar
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Today: {new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Upcoming Events
              </h4>
              <div className="space-y-2">
                <div className="flex items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Team Meeting</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">10:00 AM</p>
                  </div>
                </div>
                <div className="flex items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Project Deadline</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">3:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}