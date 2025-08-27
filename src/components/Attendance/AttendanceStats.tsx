// components/Employee/Attendance/AttendanceStats.tsx
"use client";
import { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Users,
  CheckCircle
} from 'lucide-react';

interface AttendanceStatsData {
  todayStats: {
    checkInTime?: string;
    workingHours: number;
    breakTime: number;
    status: string;
  };
  weekStats: {
    presentDays: number;
    totalDays: number;
    totalHours: number;
    averageHours: number;
    punctualityScore: number;
  };
  monthStats: {
    presentDays: number;
    totalDays: number;
    totalHours: number;
    attendanceRate: number;
    performanceScore: number;
  };
  yearStats: {
    totalWorkingDays: number;
    presentDays: number;
    totalHours: number;
    overtimeHours: number;
    averageMonthlyHours: number;
  };
}

export default function AttendanceStats() {
  const [stats, setStats] = useState<AttendanceStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employee/attendance/stats?timeframe=${timeframe}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stats');
      }

      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 75) return 'bg-blue-100 dark:bg-blue-900/20';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!stats) return null;

  // Helper functions to get specific properties based on timeframe
  const getPresentDays = () => {
    switch (timeframe) {
      case 'week':
        return stats.weekStats.presentDays;
      case 'month':
        return stats.monthStats.presentDays;
      case 'year':
        return stats.yearStats.presentDays;
      default:
        return 0;
    }
  };

  const getTotalDays = () => {
    switch (timeframe) {
      case 'week':
        return stats.weekStats.totalDays;
      case 'month':
        return stats.monthStats.totalDays;
      case 'year':
        return stats.yearStats.totalWorkingDays;
      default:
        return 0;
    }
  };

  const getTotalHours = () => {
    switch (timeframe) {
      case 'week':
        return stats.weekStats.totalHours;
      case 'month':
        return stats.monthStats.totalHours;
      case 'year':
        return stats.yearStats.totalHours;
      default:
        return 0;
    }
  };

  const getAttendanceRate = () => {
    switch (timeframe) {
      case 'week':
        return Math.round((getPresentDays() / Math.max(getTotalDays(), 1)) * 100);
      case 'month':
        return stats.monthStats.attendanceRate;
      case 'year':
        return Math.round((stats.yearStats.presentDays / Math.max(stats.yearStats.totalWorkingDays, 1)) * 100);
      default:
        return 0;
    }
  };

  const getPerformanceScore = () => {
    switch (timeframe) {
      case 'week':
        return stats.weekStats.punctualityScore;
      case 'month':
        return stats.monthStats.performanceScore;
      case 'year':
        return 85; // Mock yearly performance score
      default:
        return 0;
    }
  };

  const getAverageHours = () => {
    switch (timeframe) {
      case 'week':
        return stats.weekStats.averageHours;
      case 'month':
        return getTotalHours() / Math.max(getPresentDays(), 1);
      case 'year':
        return stats.yearStats.averageMonthlyHours;
      default:
        return 0;
    }
  };

  const getProductivityRate = () => {
    const presentDays = getPresentDays();
    const totalHours = getTotalHours();
    if (presentDays === 0) return 0;
    return Math.round((totalHours / (presentDays * 480)) * 100); // 480 minutes = 8 hours
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Attendance Overview
        </h2>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeframe === period
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Rate */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Attendance Rate</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                {getAttendanceRate().toFixed(1)}%
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {getPresentDays()}/{getTotalDays()} days
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                {timeframe === 'year' ? 'Total Hours' : 'Working Hours'}
              </p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                {formatDuration(getTotalHours())}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {timeframe === 'week' 
                  ? `Avg: ${formatDuration(getAverageHours())}`
                  : timeframe === 'year'
                  ? `Avg: ${formatDuration(stats.yearStats.averageMonthlyHours)}/month`
                  : 'This period'
                }
              </p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-800/30 rounded-lg">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Performance Score */}
        <div className={`bg-gradient-to-br rounded-lg p-4 border ${
          timeframe === 'week' 
            ? `from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800`
            : `${getScoreBgColor(getPerformanceScore())} border-current`
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                timeframe === 'week' 
                  ? 'text-purple-600 dark:text-purple-400'
                  : getScoreColor(getPerformanceScore())
              }`}>
                {timeframe === 'week' ? 'Punctuality' : 'Performance'}
              </p>
              <p className={`text-2xl font-bold ${
                timeframe === 'week' 
                  ? 'text-purple-800 dark:text-purple-300'
                  : getScoreColor(getPerformanceScore())
              }`}>
                {getPerformanceScore()}%
              </p>
              <p className={`text-xs ${
                timeframe === 'week' 
                  ? 'text-purple-600 dark:text-purple-400'
                  : getScoreColor(getPerformanceScore())
              }`}>
                {timeframe === 'week' ? 'On-time arrivals' : 'Overall score'}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${
              timeframe === 'week' 
                ? 'bg-purple-100 dark:bg-purple-800/30'
                : getScoreBgColor(getPerformanceScore())
            }`}>
              {timeframe === 'week' ? (
                <Target className={`w-6 h-6 text-purple-600 dark:text-purple-400`} />
              ) : (
                <Award className={`w-6 h-6 ${getScoreColor(getPerformanceScore())}`} />
              )}
            </div>
          </div>
        </div>

        {/* Additional Metric */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                {timeframe === 'year' ? 'Overtime' : 'Productivity'}
              </p>
              <p className="text-2xl font-bold text-orange-800 dark:text-orange-300">
                {timeframe === 'year' 
                  ? formatDuration(stats.yearStats.overtimeHours)
                  : `${getProductivityRate()}%`
                }
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {timeframe === 'year' ? 'Extra hours worked' : 'Efficiency rate'}
              </p>
            </div>
            <div className="p-2 bg-orange-100 dark:bg-orange-800/30 rounded-lg">
              {timeframe === 'year' ? (
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              ) : (
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Quick Stats */}
      {stats.todayStats && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Today's Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                stats.todayStats.status === 'present' 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <CheckCircle className={`w-6 h-6 ${
                  stats.todayStats.status === 'present' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-400'
                }`} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {stats.todayStats.status}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Check In</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {stats.todayStats.checkInTime || '--:--'}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Working</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDuration(stats.todayStats.workingHours)}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Breaks</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDuration(stats.todayStats.breakTime)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}