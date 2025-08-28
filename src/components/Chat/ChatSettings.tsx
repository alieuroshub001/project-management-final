// components/Chat/ChatSettings.tsx
"use client";
import { useState } from 'react';
import {
  Bell,
  BellOff,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Download,
  Shield,
  HelpCircle
} from 'lucide-react';

export default function ChatSettings() {
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Chat Settings
        </h3>
        
        <div className="space-y-4">
          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {notifications ? (
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Notifications
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receive notifications for new messages
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Sounds */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {sounds ? (
                <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Message Sounds
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Play sound for new messages
                </p>
              </div>
            </div>
            <button
              onClick={() => setSounds(!sounds)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                sounds ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  sounds ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {darkMode ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Dark Mode
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use dark theme for chat interface
                </p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Quick Actions
        </h4>
        <div className="space-y-2">
          <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-900 dark:text-white">Export Chat Data</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-900 dark:text-white">Privacy & Security</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <HelpCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-900 dark:text-white">Help & Support</span>
          </button>
        </div>
      </div>
    </div>
  );
}
