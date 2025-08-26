// components/Employee/Projects/RecentActivity.tsx
"use client";
import { IProjectActivity } from '@/types/employee/projectmanagement';
import { formatDistanceToNow } from 'date-fns';
import {
  FolderPlus,
  Edit,
  CheckCircle,
  UserPlus,
  MessageCircle,
  Upload,
  Trophy,
  Clock,
  Activity as ActivityIcon
} from 'lucide-react';

interface RecentActivityProps {
  activities: IProjectActivity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    const icons = {
      'project-created': FolderPlus,
      'project-updated': Edit,
      'project-completed': Trophy,
      'task-created': FolderPlus,
      'task-updated': Edit,
      'task-assigned': UserPlus,
      'task-completed': CheckCircle,
      'member-added': UserPlus,
      'member-removed': UserPlus,
      'comment-added': MessageCircle,
      'file-uploaded': Upload,
      'milestone-created': Trophy,
      'milestone-completed': CheckCircle,
      'time-logged': Clock
    };
    return icons[type as keyof typeof icons] || ActivityIcon;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      'project-created': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
      'project-updated': 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
      'project-completed': 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
      'task-created': 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
      'task-updated': 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
      'task-assigned': 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20',
      'task-completed': 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
      'member-added': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
      'member-removed': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
      'comment-added': 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20',
      'file-uploaded': 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
      'milestone-created': 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20',
      'milestone-completed': 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
      'time-logged': 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <ActivityIcon className="w-5 h-5 mr-2" />
          Recent Activity
        </h3>
        <div className="text-center py-8">
          <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <ActivityIcon className="w-5 h-5 mr-2" />
        Recent Activity
      </h3>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.map((activity) => {
          const IconComponent = getActivityIcon(activity.activityType);
          const colorClasses = getActivityColor(activity.activityType);
          
          return (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className={`flex-shrink-0 p-2 rounded-lg ${colorClasses}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">{activity.performedByName}</span>
                  <span className="ml-1">{activity.description}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {activities.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
}