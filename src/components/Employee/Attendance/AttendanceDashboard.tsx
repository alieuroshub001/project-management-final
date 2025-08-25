// components/Employee/Attendance/AttendanceDashboard.tsx
"use client";
import { useState, useEffect } from 'react';
import { IAttendance, IAttendanceSummary } from '@/types/employee/attendance';
import { format, isToday, parseISO } from 'date-fns';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Calendar,
  Coffee,
  AlertCircle
} from 'lucide-react';

export default function AttendanceDashboard() {
  const [todayAttendance, setTodayAttendance] = useState<IAttendance | null>(null);
  const [summary, setSummary] = useState<IAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [todayRes, summaryRes] = await Promise.all([
        fetch('/api/employee/attendance/today'),
        fetch('/api/employee/attendance/summary?startDate=2024-01-01&endDate=2024-12-31')
      ]);

      if (todayRes.ok) {
        const todayData = await todayRes.json();
        setTodayAttendance(todayData.data);
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      present: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      absent: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      late: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
      'early-departure': 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      'on-break': 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      present: CheckCircle,
      absent: XCircle,
      late: AlertCircle,
      'early-departure': AlertCircle,
      'on-break': Coffee
    };
    return icons[status as keyof typeof icons] || Clock;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const StatusIcon = todayAttendance ? getStatusIcon(todayAttendance.status) : Clock;

  return (
    <div className="space-y-8">
      {/* Today's Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Today's Attendance</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${getStatusColor(todayAttendance?.status || 'absent')}`}>
                <StatusIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                  {todayAttendance?.status?.replace('-', ' ') || 'Not Checked In'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {todayAttendance?.checkIns?.length ? `${todayAttendance.checkIns.length} check-ins today` : 'No check-ins yet'}
                </p>
              </div>
            </div>

            <div className="text-right">
              {todayAttendance?.totalHours ? (
                <>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {todayAttendance.totalHours}h
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total hours</div>
                </>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">Not started</div>
              )}
            </div>
          </div>

          {todayAttendance && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {todayAttendance.checkIns?.length || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Check-ins</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {todayAttendance.checkOuts?.length || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Check-outs</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {todayAttendance.breaks?.length || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Breaks</div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                  <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Check In</span>
              </div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400">Now</span>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                  <Coffee className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Start Break</span>
              </div>
              <span className="text-xs text-green-600 dark:text-green-400">15 min</span>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Check Out</span>
              </div>
              <span className="text-xs text-red-600 dark:text-red-400">End day</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.presentDays}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Present Days</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg mr-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.lateDays}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Late Days</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.attendanceRate}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Attendance Rate</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.totalRegularHours}h
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Hours</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {todayAttendance?.checkIns?.map((checkIn, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Checked in</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {format(parseISO(checkIn.timestamp.toString()), 'hh:mm a')}
                {checkIn.isLate && <span className="text-amber-500 ml-2">(Late)</span>}
              </span>
            </div>
          ))}

          {todayAttendance?.breaks?.map((breakItem, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <Coffee className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {breakItem.type} break {breakItem.end ? 'ended' : 'started'}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {format(parseISO(breakItem.start.toString()), 'hh:mm a')}
              </span>
            </div>
          ))}

          {(!todayAttendance?.checkIns?.length && !todayAttendance?.breaks?.length) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No activity recorded today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}