// components/Employee/Attendance/AttendanceSession.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Square, 
  Coffee, 
  Users,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Timer,
  Target,
  Activity,
  Zap,
  Calendar,
  MapPin
} from 'lucide-react';

interface CurrentSession {
  recordId: string;
  checkIn: string;
  currentStatus: 'working' | 'on-break' | 'namaz';
  currentActivity?: {
    type: string;
    start: string;
    duration: number;
  };
  elapsedWorkingTime: number;
  elapsedBreakTime: number;
  elapsedNamazTime: number;
  actualWorkingTime: number;
  todaysTasks: any[];
  canCheckOut: boolean;
  warnings: string[];
  shift: {
    name: string;
    startTime: string;
    endTime: string;
    requiredHours: number;
    allowedBreakTime: number;
    allowedNamazTime: number;
  };
  timeRemaining: {
    breakTime: number;
    namazTime: number;
    minimumWork: number;
    currentActivity?: number;
  };
  productivity: {
    tasksCompleted: number;
    tasksInProgress: number;
    totalTaskHours: number;
    productivityScore: number;
  };
}

interface SessionData {
  hasActiveSession: boolean;
  canCheckIn: boolean;
  session: CurrentSession | null;
}

export default function AttendanceSession() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSessionData = async () => {
    try {
      const response = await fetch('/api/employee/attendance/session');
      const data = await response.json();

      if (response.ok) {
        setSessionData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch session data');
      }
    } catch (err) {
      console.error('Failed to fetch session data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, additionalData = {}) => {
    setActionLoading(action);
    try {
      let endpoint = '';
      let method = 'POST';
      let body = additionalData;

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
            checkInReason: 'Regular check-in',
            ...additionalData
          };
          break;
        case 'check-out':
          endpoint = '/api/employee/attendance/checkout';
          body = { reason: 'End of shift', ...additionalData };
          break;
        case 'start-break':
          endpoint = '/api/employee/attendance/breaks';
          body = { type: 'break', ...additionalData };
          break;
        case 'end-break':
          endpoint = '/api/employee/attendance/breaks';
          method = 'PUT';
          break;
        case 'start-namaz':
          endpoint = '/api/employee/attendance/namaz';
          body = { type: additionalData.type || 'dhuhr', ...additionalData };
          break;
        case 'end-namaz':
          endpoint = '/api/employee/attendance/namaz';
          method = 'PUT';
          break;
        case 'ping':
          endpoint = '/api/employee/attendance/session';
          body = { action: 'ping', data: additionalData };
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method === 'PUT' && action.includes('end') ? undefined : JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Action failed');
      }

      await fetchSessionData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimeWithSeconds = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'working': 'bg-green-100 text-green-800 border-green-200',
      'on-break': 'bg-orange-100 text-orange-800 border-orange-200',
      'namaz': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status as keyof typeof colors] || colors.working;
  };

  const getBreakTypes = () => [
    { value: 'break', label: 'Regular Break', icon: Coffee },
    { value: 'meal', label: 'Meal Break', icon: Coffee },
    { value: 'tea', label: 'Tea Break', icon: Coffee },
    { value: 'personal', label: 'Personal Break', icon: Coffee }
  ];

  const getNamazTypes = () => [
    { value: 'fajr', label: 'Fajr', icon: Users },
    { value: 'dhuhr', label: 'Dhuhr', icon: Users },
    { value: 'asr', label: 'Asr', icon: Users },
    { value: 'maghrib', label: 'Maghrib', icon: Users },
    { value: 'isha', label: 'Isha', icon: Users },
    { value: 'jumma', label: 'Jumma', icon: Users }
  ];

  useEffect(() => {
    fetchSessionData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchSessionData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Failed to load session data</p>
        <button 
          onClick={fetchSessionData}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!sessionData.hasActiveSession) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">No Active Session</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {sessionData.canCheckIn 
              ? "You haven't checked in today. Start your work session to track your attendance."
              : "Your work session has ended for today."
            }
          </p>
          {sessionData.canCheckIn && (
            <button
              onClick={() => handleAction('check-in')}
              disabled={actionLoading === 'check-in'}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
            >
              <Play className="w-5 h-5 mr-2" />
              {actionLoading === 'check-in' ? 'Starting Session...' : 'Start Work Session'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const session = sessionData.session!;

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Active Work Session</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Started at {new Date(session.checkIn).toLocaleString()}
            </p>
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-medium border ${getStatusColor(session.currentStatus)}`}>
            {session.currentStatus === 'working' && <Activity className="w-5 h-5 mr-2" />}
            {session.currentStatus === 'on-break' && <Coffee className="w-5 h-5 mr-2" />}
            {session.currentStatus === 'namaz' && <Users className="w-5 h-5 mr-2" />}
            {session.currentStatus === 'working' ? 'Working' :
             session.currentStatus === 'on-break' ? `On ${session.currentActivity?.type} Break` :
             `In ${session.currentActivity?.type}`}
          </div>
        </div>

        {/* Live Timer Display */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <Timer className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatTime(session.elapsedWorkingTime)}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Total Time</div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <Zap className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {formatTime(session.actualWorkingTime)}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Working Time</div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
            <Coffee className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {formatTime(session.elapsedBreakTime)}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">Break Time</div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {formatTime(session.elapsedNamazTime)}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Prayer Time</div>
          </div>
        </div>

        {/* Current Activity */}
        {session.currentActivity && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Current {session.currentStatus === 'on-break' ? 'Break' : 'Activity'}: {session.currentActivity.type}
                </span>
              </div>
              <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                {formatTime(session.currentActivity.duration)}
                {session.timeRemaining.currentActivity !== undefined && (
                  <span className="text-xs ml-2">
                    ({formatTime(session.timeRemaining.currentActivity)} remaining)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {session.warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {session.warnings.map((warning, index) => (
              <div key={index} className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
                <span className="text-sm text-red-700 dark:text-red-300">{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {session.currentStatus === 'working' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {getBreakTypes().map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => handleAction('start-break', { type: value })}
                      disabled={actionLoading === 'start-break'}
                      className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {getNamazTypes().slice(1, 4).map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => handleAction('start-namaz', { type: value })}
                      disabled={actionLoading === 'start-namaz'}
                      className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {session.currentStatus === 'on-break' && (
              <button
                onClick={() => handleAction('end-break')}
                disabled={actionLoading === 'end-break'}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Square className="w-5 h-5 mr-2" />
                {actionLoading === 'end-break' ? 'Ending Break...' : `End ${session.currentActivity?.type} Break`}
              </button>
            )}

            {session.currentStatus === 'namaz' && (
              <button
                onClick={() => handleAction('end-namaz')}
                disabled={actionLoading === 'end-namaz'}
                className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {actionLoading === 'end-namaz' ? 'Completing...' : `Complete ${session.currentActivity?.type}`}
              </button>
            )}

            <button
              onClick={() => handleAction('check-out')}
              disabled={!session.canCheckOut || actionLoading === 'check-out'}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="w-5 h-5 mr-2" />
              {actionLoading === 'check-out' ? 'Checking Out...' : 'End Work Session'}
            </button>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Details</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Shift</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {session.shift.name} ({session.shift.startTime} - {session.shift.endTime})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Required Hours</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {session.shift.requiredHours} hours
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Coffee className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Break Allowance</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatTime(session.timeRemaining.breakTime)} remaining
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Prayer Allowance</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatTime(session.timeRemaining.namazTime)} remaining
              </span>
            </div>

            {session.timeRemaining.minimumWork > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Min. Work Remaining</span>
                </div>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {formatTime(session.timeRemaining.minimumWork)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Productivity Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Productivity</h3>
          <BarChart3 className="w-5 h-5 text-indigo-500" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.productivity.tasksCompleted}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Completed Tasks</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.productivity.tasksInProgress}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">In Progress</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.productivity.totalTaskHours.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Task Hours</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.productivity.productivityScore}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}