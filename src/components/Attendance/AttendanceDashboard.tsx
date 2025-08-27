// components/Employee/Attendance/AttendanceDashboard.tsx
"use client";
import { useState, useEffect } from 'react';
import { IAttendanceDashboard } from '@/types/attendance';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Clock,
  Calendar,
  Coffee,
  Moon,
  CheckCircle,
  AlertTriangle,
  Activity,
  TrendingUp,
  User,
  MapPin
} from 'lucide-react';

export default function AttendanceDashboard() {
  const [dashboardData, setDashboardData] = useState<IAttendanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employee/attendance/dashboard');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }

      setDashboardData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="mt-3 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { todaysAttendance, weeklyStats, monthlyStats, recentAttendance, upcomingShifts } = dashboardData;

  return (
    <div className="space-y-8">
      {/* Today's Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Today's Status</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatTime(currentTime)}
            </div>
          </div>

          <div className="space-y-6">
            {/* Check-in Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${
                  todaysAttendance.hasCheckedIn 
                    ? 'bg-green-100 dark:bg-green-900/20' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <CheckCircle className={`w-5 h-5 ${
                    todaysAttendance.hasCheckedIn 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-400'
                  }`} />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900 dark:text-white">Check In</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {todaysAttendance.hasCheckedIn && todaysAttendance.attendance?.checkInTime
                      ? formatTime(new Date(todaysAttendance.attendance.checkInTime))
                      : 'Not checked in'
                    }
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                todaysAttendance.hasCheckedIn 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {todaysAttendance.hasCheckedIn ? 'Checked In' : 'Not Checked In'}
              </div>
            </div>

            {/* Check-out Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${
                  todaysAttendance.hasCheckedOut 
                    ? 'bg-blue-100 dark:bg-blue-900/20' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <Clock className={`w-5 h-5 ${
                    todaysAttendance.hasCheckedOut 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-400'
                  }`} />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900 dark:text-white">Check Out</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {todaysAttendance.hasCheckedOut && todaysAttendance.attendance?.checkOutTime
                      ? formatTime(new Date(todaysAttendance.attendance.checkOutTime))
                      : 'Not checked out'
                    }
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                todaysAttendance.hasCheckedOut 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {todaysAttendance.hasCheckedOut ? 'Checked Out' : 'Not Checked Out'}
              </div>
            </div>

            {/* Working Hours */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Working Hours</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatDuration(todaysAttendance.totalWorkingHours)}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              
              {todaysAttendance.hasCheckedIn && !todaysAttendance.hasCheckedOut && (
                <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    • Remaining: {formatDuration(todaysAttendance.remainingWorkingHours)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Break Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Break Status</h2>
          
          <div className="space-y-4">
            {/* Active Breaks */}
            {todaysAttendance.activeBreaks.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" />
                  <span className="font-medium text-amber-800 dark:text-amber-300">Active Break</span>
                </div>
                {todaysAttendance.activeBreaks.map((breakItem) => (
                  <div key={breakItem.id} className="text-sm text-amber-700 dark:text-amber-400">
                    <p className="font-medium capitalize">{breakItem.breakType.replace('-', ' ')} Break</p>
                    <p>Started at {formatTime(new Date(breakItem.startTime))}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Active Namaz Breaks */}
            {todaysAttendance.activeNamazBreaks.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Moon className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  <span className="font-medium text-green-800 dark:text-green-300">Active Namaz Break</span>
                </div>
                {todaysAttendance.activeNamazBreaks.map((namazBreak) => (
                  <div key={namazBreak.id} className="text-sm text-green-700 dark:text-green-400">
                    <p className="font-medium capitalize">{namazBreak.namazType} Prayer</p>
                    <p>Started at {formatTime(new Date(namazBreak.startTime))}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Total Break Time */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Break Time Today</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDuration(todaysAttendance.totalBreakTime)}
              </span>
            </div>

            {todaysAttendance.activeBreaks.length === 0 && todaysAttendance.activeNamazBreaks.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <Coffee className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active breaks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Weekly Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            This Week
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Working Days</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {weeklyStats.presentDays}/{weeklyStats.totalWorkingDays}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Hours</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDuration(weeklyStats.totalWorkingHours)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Average Hours</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDuration(weeklyStats.averageWorkingHours)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Late Check-ins</span>
              <span className={`font-medium ${
                weeklyStats.lateCheckIns > 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {weeklyStats.lateCheckIns}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            This Month
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Attendance Rate</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                {monthlyStats.attendancePercentage.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Working Days</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {monthlyStats.presentDays}/{monthlyStats.totalWorkingDays}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Hours</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDuration(monthlyStats.totalWorkingHours)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Overtime Hours</span>
              <span className={`font-medium ${
                monthlyStats.totalOvertimeHours > 0 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {formatDuration(monthlyStats.totalOvertimeHours)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Attendance Progress</span>
                <span>{monthlyStats.attendancePercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(monthlyStats.attendancePercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Attendance</h2>
        
        {recentAttendance.length > 0 ? (
          <div className="space-y-3">
            {recentAttendance.slice(0, 5).map((attendance) => (
              <div key={attendance.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    attendance.status === 'present' 
                      ? 'bg-green-500' 
                      : attendance.status === 'partial'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(attendance.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {attendance.shift} shift
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDuration(attendance.totalWorkingHours)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {attendance.checkInTime && attendance.checkOutTime ? (
                      `${formatTime(new Date(attendance.checkInTime))} - ${formatTime(new Date(attendance.checkOutTime))}`
                    ) : (
                      attendance.checkInTime ? `In: ${formatTime(new Date(attendance.checkInTime))}` : 'No record'
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent attendance data</p>
          </div>
        )}
      </div>
    </div>
  );
}