// components/Employee/Chat/ChatStats.tsx
import { TrendingUp, MessageSquare, Users, Clock } from 'lucide-react';

export function ChatStats() {
  const stats = [
    {
      title: 'Messages Today',
      value: 24,
      icon: MessageSquare,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Active Chats',
      value: 8,
      icon: Users,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Avg Response Time',
      value: '2m',
      icon: Clock,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2" />
        Chat Statistics
      </h3>
      
      <div className="space-y-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <IconComponent className={`w-5 h-5 ${stat.color}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stat.title}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {stat.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}