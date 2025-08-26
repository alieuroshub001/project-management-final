// components/Employee/Projects/UpcomingDeadlines.tsx
"use client";
import { formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckSquare,
  Trophy,
  FolderOpen
} from 'lucide-react';

interface UpcomingDeadline {
  type: 'project' | 'task' | 'milestone';
  id: string;
  title: string;
  dueDate: Date;
  status: string;
}

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
}

export default function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  const getDeadlineIcon = (type: string) => {
    const icons = {
      project: FolderOpen,
      task: CheckSquare,
      milestone: Trophy
    };
    return icons[type as keyof typeof icons] || Calendar;
  };

  const getDeadlineColor = (type: string, status: string, dueDate: Date) => {
    const now = new Date();
    const isOverdue = dueDate < now;
    const isUpcoming = (dueDate.getTime() - now.getTime()) < 24 * 60 * 60 * 1000; // within 24 hours

    if (isOverdue && status !== 'completed') {
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    }
    if (isUpcoming && status !== 'completed') {
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    }
    if (status === 'completed') {
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    }
    
    const colors = {
      project: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      task: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
      milestone: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
    };
    return colors[type as keyof typeof colors] || colors.task;
  };

  const getUrgencyIndicator = (dueDate: Date, status: string) => {
    if (status === 'completed') return null;
    
    const now = new Date();
    const isOverdue = dueDate < now;
    const isUpcoming = (dueDate.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;

    if (isOverdue) {
      return (
        <div className="flex items-center text-red-600 dark:text-red-400 text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Overdue
        </div>
      );
    }
    if (isUpcoming) {
      return (
        <div className="flex items-center text-amber-600 dark:text-amber-400 text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Due soon
        </div>
      );
    }
    return null;
  };

  if (!deadlines || deadlines.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Upcoming Deadlines
        </h3>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No upcoming deadlines</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <Calendar className="w-5 h-5 mr-2" />
        Upcoming Deadlines
      </h3>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {deadlines.map((deadline) => {
          const IconComponent = getDeadlineIcon(deadline.type);
          const colorClasses = getDeadlineColor(deadline.type, deadline.status, new Date(deadline.dueDate));
          const urgencyIndicator = getUrgencyIndicator(new Date(deadline.dueDate), deadline.status);
          
          return (
            <div key={`${deadline.type}-${deadline.id}`} className={`p-4 rounded-lg border transition-colors hover:shadow-sm ${colorClasses}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <IconComponent className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {deadline.title}
                      </h4>
                      {urgencyIndicator}
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {deadline.type} • {deadline.status}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(deadline.dueDate), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {deadlines.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
            View all deadlines
          </button>
        </div>
      )}
    </div>
  );
}