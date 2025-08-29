// components/Employee/Chat/ChatSettings.tsx
import { Settings, Bell, Moon, Globe, Shield } from 'lucide-react';

export function ChatSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Chat Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Desktop Notifications</span>
              <input type="checkbox" className="rounded" defaultChecked />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Sound Alerts</span>
              <input type="checkbox" className="rounded" defaultChecked />
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Privacy
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Read Receipts</span>
              <input type="checkbox" className="rounded" defaultChecked />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Online Status</span>
              <input type="checkbox" className="rounded" defaultChecked />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}