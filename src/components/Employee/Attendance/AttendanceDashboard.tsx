// components/Employee/Attendance/AttendanceDashboard.tsx
"use client";
import { useState, useEffect } from 'react';
import { formatDistance } from 'date-fns';
import { 
  Clock, 
  Play, 
  Square, 
  Coffee, 
  Calendar,
  CheckCircle, 
  TrendingUp,
  Activity,
  Target,
  Users,
  ArrowRight,
  Clock3,
  Calendar as CalendarIcon,
  Zap,
  Award
} from 'lucide-react';

interface TabType {
  dashboard: string;
  session: string;
  calendar: string;
  records: string;
  tasks: string;
  reports: string;
}

interface AttendanceDashboardProps {
  onNavigate: (tab: keyof TabType) => void;
}

interface DashboardData {
  today: {
    status: string;
    checkIn?: string;
    currentWorkingTime: number;
    totalBreaks: number;
    totalNamaz: number;
    tasksCompleted: number;
    isOnBreak: boolean;
    isInNamaz: boolean;
    currentBreakType?: string;
    productivityScore: number;
  };
  thisWeek: {
    totalDays: number;
    presentDays: number;
    totalHours: number;
    averageHours: number;
    totalTasks: number;
    punctualityRate: number;
  };
  thisMonth: {
    totalWorkingDays: number;
    presentDays: number;
    totalHours: number;
    attendanceRate: number;
    totalTasks: number;
    productivityScore: number;
  };
  quickActions: {
    canCheckIn: boolean;
    canCheckOut: boolean;
    canStartBreak: boolean;
    canEndBreak: boolean;
    canStartNamaz: boolean;
    canEndNamaz: boolean;
    isOnBreak: boolean;
    isInNamaz: boolean;
  };
  recentActivity: Array<{
    date: string;
    status: string;
    hours: number;
    tasks: number;
    flags: {
      isLate: boolean;
      isEarlyDeparture: boolean;
    };
  }>;
}

export default function AttendanceDashboard({ onNavigate }: AttendanceDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/employee/attendance/dashboard');
      const data = await response.json();

      if (response.ok) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setActionLoading(action);
    try {
      let endpoint = '';
      let method = 'POST';
      let body = {};

      switch (action) {
        case 'check-in':
          endpoint = '/api/employee/attendance';
          body = {
            shift: {
              name: 'Standard Shift',
              type: 'morning',
              startTime: '09:00',
              endTime: '18:00',
              requiredHours: 8,
              allowedBreakTime: 60,
              allowedNamazTime: 30
            },
            checkInReason: 'Regular check-in'
          };
          break;
        case 'check-out':
          endpoint = '/api/employee/attendance/checkout';
          body = { reason: 'End of shift' };
          break;
        case 'start-break':
          endpoint = '/api/employee/attendance/breaks';
          body = { type: 'break' };
          break;
        case 'end-break':
          endpoint = '/api/employee/attendance/breaks';
          method = 'PUT';
          break;
        case 'start-namaz':
          endpoint = '/api/employee/attendance/namaz';
          body = { type: 'dhuhr' };
          break;
        case 'end-namaz':
          endpoint = '/api/employee/attendance/namaz';
          method = 'PUT';
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method === 'PUT' ? undefined : JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Action failed');
      }

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every minute
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'not-checked-in': 'bg-gray-100 text-gray-800 border-gray-200',
      'present': 'bg-green-100 text-green-800 border-green-200',
      'late': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'working': 'bg-blue-100 text-blue-800 border-blue-200',
      'on-break': 'bg-orange-100 text-orange-800 border-orange-200',
      'namaz': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status as keyof typeof colors] || colors['not-checked-in'];
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-96 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Failed to load dashboard data</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Status</h3>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="space-y-3">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(dashboardData.today.isOnBreak ? 'on-break' : dashboardData.today.isInNamaz ? 'namaz' : dashboardData.today.status)}`}>
              {dashboardData.today.isOnBreak ? `On ${dashboardData.today.currentBreakType} Break` :
               dashboardData.today.isInNamaz ? `In ${dashboardData.today.currentBreakType}` :
               dashboardData.today.status === 'not-checked-in' ? 'Not Checked In' : 'Working'}
            </div>
            {dashboardData.today.checkIn && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Started: {new Date(dashboardData.today.checkIn).toLocaleTimeString()}
              </div>
            )}
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatTime(dashboardData.today.currentWorkingTime)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Working time today</div>
          </div>
        </div>

        {/* Today's Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Activities</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</span>
              <span className="font-semibold text-gray-900 dark:text-white">{dashboardData.today.tasksCompleted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Breaks Taken</span>
              <span className="font-semibold text-gray-900 dark:text-white">{dashboardData.today.totalBreaks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Prayers</span>
              <span className="font-semibold text-gray-900 dark:text-white">{dashboardData.today.totalNamaz}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Productivity Score</span>
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-2 bg-indigo-500 rounded-full" 
                      style={{ width: `${dashboardData.today.productivityScore}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {dashboardData.today.productivityScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-2">
            {dashboardData.quickActions.canCheckIn && (
              <button
                onClick={() => handleQuickAction('check-in')}
                disabled={actionLoading === 'check-in'}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 mr-2" />
                {actionLoading === 'check-in' ? 'Checking In...' : 'Check In'}
              </button>
            )}

            {dashboardData.quickActions.canCheckOut && (
              <button
                onClick={() => handleQuickAction('check-out')}
                disabled={actionLoading === 'check-out'}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Square className="w-4 h-4 mr-2" />
                {actionLoading === 'check-out' ? 'Checking Out...' : 'Check Out'}
              </button>
            )}

            {dashboardData.quickActions.canStartBreak && (
              <button
                onClick={() => handleQuickAction('start-break')}
                disabled={actionLoading === 'start-break'}
                className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Coffee className="w-4 h-4 mr-2" />
                {actionLoading === 'start-break' ? 'Starting...' : 'Start Break'}
              </button>
            )}

            {dashboardData.quickActions.canEndBreak && (
              <button
                onClick={() => handleQuickAction('end-break')}
                disabled={actionLoading === 'end-break'}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Clock className="w-4 h-4 mr-2" />
                {actionLoading === 'end-break' ? 'Ending...' : 'End Break'}
              </button>
            )}

            {dashboardData.quickActions.canStartNamaz && (
              <button
                onClick={() => handleQuickAction('start-namaz')}
                disabled={actionLoading === 'start-namaz'}
                className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users className="w-4 h-4 mr-2" />
                {actionLoading === 'start-namaz' ? 'Starting...' : 'Start Prayer'}
              </button>
            )}

            {dashboardData.quickActions.canEndNamaz && (
              <button
                onClick={() => handleQuickAction('end-namaz')}
                disabled={actionLoading === 'end-namaz'}
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Clock className="w-4 h-4 mr-2" />
                {actionLoading === 'end-namaz' ? 'Ending...' : 'End Prayer'}
              </button>
            )}

            <button
              onClick={() => onNavigate('session')}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Clock3 className="w-4 h-4 mr-2" />
              View Session Details
            </button>
          </div>
        </div>
      </div>

      {/* Weekly & Monthly Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Week Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">This Week</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.thisWeek.presentDays}/{dashboardData.thisWeek.totalDays}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Days Present</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatTime(Math.round(dashboardData.thisWeek.totalHours * 60))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Hours</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.thisWeek.totalTasks}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tasks</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(dashboardData.thisWeek.punctualityRate)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Punctuality</div>
            </div>
          </div>
        </div>

        {/* This Month Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">This Month</h3>
            <Award className="w-5 h-5 text-purple-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(dashboardData.thisMonth.attendanceRate)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Attendance Rate</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatTime(Math.round(dashboardData.thisMonth.totalHours * 60))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Hours</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.thisMonth.totalTasks}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tasks</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(dashboardData.thisMonth.productivityScore)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Productivity</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => onNavigate('calendar')}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <CalendarIcon className="w-8 h-8 text-indigo-500" />
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">View Calendar</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            See your attendance calendar with detailed view
          </p>
        </button>

        <button
          onClick={() => onNavigate('tasks')}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-green-500" />
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Manage Tasks</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add and track your daily tasks and productivity
          </p>
        </button>

        <button
          onClick={() => onNavigate('reports')}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-purple-500" />
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">View Reports</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate detailed attendance and productivity reports
          </p>
        </button>
      </div>

      {/* Recent Activity */}
      {dashboardData.recentActivity.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <button
              onClick={() => onNavigate('records')}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-3">
            {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.status === 'present' ? 'bg-green-500' :
                    activity.status === 'late' ? 'bg-yellow-500' :
                    activity.status === 'absent' ? 'bg-red-500' : 'bg-gray-400'
                  }`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(activity.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{activity.status}</span>
                      {activity.flags.isLate && (
                        <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded">Late</span>
                      )}
                      {activity.flags.isEarlyDeparture && (
                        <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded">Early</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{activity.hours}h</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{activity.tasks} tasks</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}