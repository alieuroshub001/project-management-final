// components/Employee/Attendance/AttendanceQuickActions.tsx
"use client";
import { useState, useEffect } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  Moon,
  History,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Play,
  Square,
  ChevronRight
} from 'lucide-react';

type TabType = 'dashboard' | 'checkin' | 'history' | 'reports';

interface QuickActionsProps {
  onActionClick: (tab: TabType) => void;
}

interface QuickActionStatus {
  canCheckIn: boolean;
  canCheckOut: boolean;
  hasActiveBreaks: boolean;
  hasActiveNamazBreaks: boolean;
  isCheckedIn: boolean;
  currentStatus: string;
}

export default function AttendanceQuickActions({ onActionClick }: QuickActionsProps) {
  const [status, setStatus] = useState<QuickActionStatus>({
    canCheckIn: true,
    canCheckOut: false,
    hasActiveBreaks: false,
    hasActiveNamazBreaks: false,
    isCheckedIn: false,
    currentStatus: 'Not checked in'
  });
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchQuickActionStatus();
    
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchQuickActionStatus = async () => {
    try {
      const response = await fetch('/api/employee/attendance/quick-status');
      const data = await response.json();

      if (response.ok) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch quick action status:', err);
    }
  };

  const handleQuickAction = async (action: 'checkin' | 'checkout' | 'break' | 'namaz') => {
    if (action === 'checkin' || action === 'checkout') {
      onActionClick('checkin');
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      let method = 'POST';
      let body = {};

      if (action === 'break') {
        if (status.hasActiveBreaks) {
          // End active break - would need break ID, so redirect to check-in page
          onActionClick('checkin');
          return;
        } else {
          endpoint = '/api/employee/attendance/breaks';
          body = { breakType: 'general' };
        }
      } else if (action === 'namaz') {
        if (status.hasActiveNamazBreaks) {
          // End active namaz break - would need break ID, so redirect to check-in page
          onActionClick('checkin');
          return;
        } else {
          // For quick action, we'll start a general prayer break
          // User can specify which prayer on the main page
          endpoint = '/api/employee/attendance/namaz';
          body = { namazType: 'zuhr' }; // Default to Zuhr for quick action
        }
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        fetchQuickActionStatus();
      }
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const quickActions = [
    {
      id: 'checkin',
      title: status.canCheckIn ? 'Check In' : 'Check Out',
      description: status.canCheckIn ? 'Start your workday' : 'End your workday',
      icon: status.canCheckIn ? LogIn : LogOut,
      color: status.canCheckIn ? 'green' : 'blue',
      action: () => handleQuickAction(status.canCheckIn ? 'checkin' : 'checkout'),
      disabled: !status.canCheckIn && !status.canCheckOut,
      badge: status.isCheckedIn ? 'Active' : null
    },
    {
      id: 'break',
      title: status.hasActiveBreaks ? 'End Break' : 'Take Break',
      description: status.hasActiveBreaks ? 'Resume your work' : 'Take a short break',
      icon: status.hasActiveBreaks ? Square : Play,
      color: 'amber',
      action: () => handleQuickAction('break'),
      disabled: !status.isCheckedIn,
      badge: status.hasActiveBreaks ? 'On Break' : null
    },
    {
      id: 'namaz',
      title: status.hasActiveNamazBreaks ? 'End Prayer' : 'Prayer Break',
      description: status.hasActiveNamazBreaks ? 'Complete your prayer' : 'Take prayer break',
      icon: status.hasActiveNamazBreaks ? Square : Moon,
      color: 'emerald',
      action: () => handleQuickAction('namaz'),
      disabled: !status.isCheckedIn,
      badge: status.hasActiveNamazBreaks ? 'In Prayer' : null
    },
    {
      id: 'history',
      title: 'View History',
      description: 'Check attendance records',
      icon: History,
      color: 'purple',
      action: () => onActionClick('history'),
      disabled: false
    }
  ];

  const navigationActions = [
    {
      id: 'reports',
      title: 'Generate Reports',
      description: 'Download attendance data',
      icon: FileText,
      action: () => onActionClick('reports')
    },
    {
      id: 'calendar',
      title: 'Attendance Calendar',
      description: 'View monthly overview',
      icon: Calendar,
      action: () => onActionClick('history') // Could be a separate calendar view
    }
  ];

  const getColorClasses = (color: string, disabled: boolean = false) => {
    if (disabled) {
      return {
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700',
        text: 'text-gray-400 dark:text-gray-500',
        icon: 'text-gray-300 dark:text-gray-600'
      };
    }

    const colors = {
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30',
        border: 'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700',
        text: 'text-green-800 dark:text-green-300',
        icon: 'text-green-600 dark:text-green-400'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
        text: 'text-blue-800 dark:text-blue-300',
        icon: 'text-blue-600 dark:text-blue-400'
      },
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30',
        border: 'border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700',
        text: 'text-amber-800 dark:text-amber-300',
        icon: 'text-amber-600 dark:text-amber-400'
      },
      emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
        border: 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700',
        text: 'text-emerald-800 dark:text-emerald-300',
        icon: 'text-emerald-600 dark:text-emerald-400'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30',
        border: 'border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700',
        text: 'text-purple-800 dark:text-purple-300',
        icon: 'text-purple-600 dark:text-purple-400'
      }
    };

    return colors[color as keyof typeof colors] || colors.green;
  };

  return (
    <div className="space-y-6">
      {/* Current Status Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-3 rounded-full mr-4 ${
              status.isCheckedIn 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {status.isCheckedIn ? (
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {status.currentStatus}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current time: {formatTime(currentTime)}
              </p>
              {(status.hasActiveBreaks || status.hasActiveNamazBreaks) && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  {status.hasActiveBreaks && 'On break'} 
                  {status.hasActiveBreaks && status.hasActiveNamazBreaks && ' • '}
                  {status.hasActiveNamazBreaks && 'In prayer'}
                </p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <button
              onClick={() => onActionClick('checkin')}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center"
            >
              Manage Attendance
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const colors = getColorClasses(action.color, action.disabled);
            const IconComponent = action.icon;
            
            return (
              <button
                key={action.id}
                onClick={action.action}
                disabled={action.disabled || loading}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${colors.bg} ${colors.border} ${
                  action.disabled || loading 
                    ? 'cursor-not-allowed' 
                    : 'hover:shadow-md transform hover:-translate-y-0.5'
                }`}
              >
                {action.badge && (
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    action.color === 'green' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                      : action.color === 'amber'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-200'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200'
                  }`}>
                    {action.badge}
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${
                    action.disabled 
                      ? 'bg-gray-200 dark:bg-gray-700' 
                      : action.color === 'green'
                      ? 'bg-green-100 dark:bg-green-800/30'
                      : action.color === 'blue'
                      ? 'bg-blue-100 dark:bg-blue-800/30'
                      : action.color === 'amber'
                      ? 'bg-amber-100 dark:bg-amber-800/30'
                      : action.color === 'emerald'
                      ? 'bg-emerald-100 dark:bg-emerald-800/30'
                      : 'bg-purple-100 dark:bg-purple-800/30'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className={`font-semibold ${colors.text}`}>
                    {action.title}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    action.disabled 
                      ? 'text-gray-400 dark:text-gray-500' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {action.description}
                  </p>
                </div>

                {loading && action.id === 'break' && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">More Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {navigationActions.map((action) => {
            const IconComponent = action.icon;
            
            return (
              <button
                key={action.id}
                onClick={action.action}
                className="flex items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                  <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {status.isCheckedIn ? '●' : '○'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Status</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {status.hasActiveBreaks ? '1' : '0'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Breaks</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatTime(currentTime).split(' ')[0]}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current Time</p>
          </div>
        </div>
      </div>
    </div>
  );
}