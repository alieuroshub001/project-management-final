// components/Employee/Attendance/AttendanceQuickActions.tsx
"use client";

import { 
  LogIn,
  LogOut,
  Clock,
  Calendar,
  History,
  Coffee,
  ArrowRight,
  BarChart3
} from 'lucide-react';

interface AttendanceQuickActionsProps {
  onActionClick: (action: string) => void;
}

export default function AttendanceQuickActions({ onActionClick }: AttendanceQuickActionsProps) {
  const quickActions = [
    {
      title: 'Check In/Out',
      description: 'Mark your attendance for today',
      icon: Clock,
      action: 'checkin',
      color: 'indigo',
      isPrimary: true
    },
    {
      title: 'View Records',
      description: 'Check your attendance history',
      icon: History,
      action: 'list',
      color: 'blue'
    },
    {
      title: 'Calendar View',
      description: 'See attendance on calendar',
      icon: Calendar,
      action: 'calendar',
      color: 'green'
    },
    {
      title: 'Statistics',
      description: 'View detailed attendance stats',
      icon: BarChart3,
      action: 'dashboard',
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string, isPrimary?: boolean) => {
    const colors = {
      indigo: {
        bg: isPrimary ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-indigo-50 dark:bg-indigo-900/20',
        border: isPrimary ? 'border-indigo-300 dark:border-indigo-700' : 'border-indigo-200 dark:border-indigo-800',
        hover: isPrimary ? 'hover:bg-indigo-200 dark:hover:bg-indigo-900/40 hover:border-indigo-400 dark:hover:border-indigo-600' : 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700',
        icon: isPrimary ? 'text-indigo-700 dark:text-indigo-300' : 'text-indigo-600 dark:text-indigo-400',
        arrow: isPrimary ? 'text-indigo-700 dark:text-indigo-300 group-hover:translate-x-1' : 'text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700',
        icon: 'text-blue-600 dark:text-blue-400',
        arrow: 'text-blue-600 dark:text-blue-400 group-hover:translate-x-1'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        hover: 'hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-300 dark:hover:border-green-700',
        icon: 'text-green-600 dark:text-green-400',
        arrow: 'text-green-600 dark:text-green-400 group-hover:translate-x-1'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700',
        icon: 'text-purple-600 dark:text-purple-400',
        arrow: 'text-purple-600 dark:text-purple-400 group-hover:translate-x-1'
      }
    };
    return colors[color as keyof typeof colors] || colors.indigo;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Quick Actions</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage your attendance with these quick shortcuts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          const colorClasses = getColorClasses(action.color, action.isPrimary);
          
          return (
            <button
              key={index}
              onClick={() => onActionClick(action.action)}
              className={`group p-6 border rounded-xl transition-all duration-200 text-left ${colorClasses.bg} ${colorClasses.border} ${colorClasses.hover} hover:shadow-md transform hover:-translate-y-1 ${
                action.isPrimary ? 'ring-2 ring-indigo-500/20' : ''
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${colorClasses.bg} bg-opacity-50 dark:bg-opacity-30`}>
                    <IconComponent className={`w-6 h-6 ${colorClasses.icon}`} />
                  </div>
                  <ArrowRight className={`w-4 h-4 ${colorClasses.arrow} transition-transform duration-200`} />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {action.description}
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    {action.isPrimary ? 'Priority Action' : 'Quick Access'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Today's Status Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Status</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track your daily attendance progress
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => onActionClick('checkin')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Check In
            </button>
            <button
              onClick={() => onActionClick('checkin')}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Check Out
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check-In Time</div>
                <div className="font-semibold text-gray-900 dark:text-white">--:--</div>
              </div>
              <LogIn className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hours Worked</div>
                <div className="font-semibold text-gray-900 dark:text-white">0.0h</div>
              </div>
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Break Time</div>
                <div className="font-semibold text-gray-900 dark:text-white">0 min</div>
              </div>
              <Coffee className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}