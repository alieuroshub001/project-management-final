// components/Employee/Attendance/AttendanceStats.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  Users,
  BarChart3
} from 'lucide-react';

interface AttendanceStats {
  totalWorkDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyDepartures: number;
  totalHoursWorked: number;
  averageHoursPerDay: number;
  overtimeHours: number;
  attendancePercentage: number;
  currentStreak: number;
}

export default function AttendanceStats() {
  const [stats, setStats] = useState<AttendanceStats>({
    totalWorkDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    earlyDepartures: 0,
    totalHoursWorked: 0,
    averageHoursPerDay: 0,
    overtimeHours: 0,
    attendancePercentage: 0,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('thisMonth');

  const periodOptions = [
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' }
  ];

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/employee/attendance/stats?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const statCards = [
    {
      title: 'Present Days',
      value: stats.presentDays,
      total: stats.totalWorkDays,
      icon: CheckCircle,
      color: 'green',
      percentage: stats.totalWorkDays > 0 ? (stats.presentDays / stats.totalWorkDays) * 100 : 0,
      trend: '+2.1%'
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendancePercentage.toFixed(1)}%`,
      icon: BarChart3,
      color: stats.attendancePercentage >= 95 ? 'green' : stats.attendancePercentage >= 85 ? 'yellow' : 'red',
      subtitle: `${stats.presentDays}/${stats.totalWorkDays} days`
    },
    {
      title: 'Late Arrivals',
      value: stats.lateDays,
      icon: AlertTriangle,
      color: stats.lateDays === 0 ? 'green' : stats.lateDays <= 3 ? 'yellow' : 'red',
      subtitle: `${stats.totalWorkDays > 0 ? ((stats.lateDays / stats.totalWorkDays) * 100).toFixed(1) : 0}% of work days`
    },
    {
      title: 'Total Hours',
      value: stats.totalHoursWorked.toFixed(1),
      icon: Clock,
      color: 'blue',
      subtitle: `Avg: ${stats.averageHoursPerDay.toFixed(1)}h/day`
    },
    {
      title: 'Overtime Hours',
      value: stats.overtimeHours.toFixed(1),
      icon: TrendingUp,
      color: stats.overtimeHours > 0 ? 'purple' : 'gray',
      subtitle: stats.overtimeHours > 0 ? 'Extra hours worked' : 'No overtime'
    },
    {
      title: 'Current Streak',
      value: stats.currentStreak,
      icon: Users,
      color: stats.currentStreak >= 5 ? 'green' : 'blue',
      subtitle: stats.currentStreak > 0 ? 'consecutive present days' : 'days without absence'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: {
        bg: 'bg-green-500',
        text: 'text-green-600 dark:text-green-400',
        lightBg: 'bg-green-50 dark:bg-green-900/20'
      },
      blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        lightBg: 'bg-blue-50 dark:bg-blue-900/20'
      },
      red: {
        bg: 'bg-red-500',
        text: 'text-red-600 dark:text-red-400',
        lightBg: 'bg-red-50 dark:bg-red-900/20'
      },
      yellow: {
        bg: 'bg-yellow-500',
        text: 'text-yellow-600 dark:text-yellow-400',
        lightBg: 'bg-yellow-50 dark:bg-yellow-900/20'
      },
      purple: {
        bg: 'bg-purple-500',
        text: 'text-purple-600 dark:text-purple-400',
        lightBg: 'bg-purple-50 dark:bg-purple-900/20'
      },
      gray: {
        bg: 'bg-gray-500',
        text: 'text-gray-600 dark:text-gray-400',
        lightBg: 'bg-gray-50 dark:bg-gray-900/20'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Period Selector Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Attendance Overview</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your attendance statistics and performance metrics
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          {periodOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const IconComponent = card.icon;
          const colorClasses = getColorClasses(card.color);
          
          return (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
            >
              <div className="flex items-start">
                <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses.lightBg}`}>
                  <IconComponent className={`w-6 h-6 ${colorClasses.text}`} />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {card.title}
                    </p>
                    {card.trend && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {card.trend}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {card.subtitle}
                    </p>
                  )}
                  {card.percentage !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{card.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${colorClasses.bg} transition-all duration-300`}
                          style={{ width: `${Math.min(card.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-start">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-4">
            <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Quick Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Attendance Rate</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {stats.attendancePercentage >= 95 ? 'Excellent' : 
                   stats.attendancePercentage >= 85 ? 'Good' : 
                   stats.attendancePercentage >= 75 ? 'Average' : 'Needs Improvement'}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Punctuality</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {stats.lateDays === 0 ? 'Perfect' :
                   stats.lateDays <= 2 ? 'Good' :
                   stats.lateDays <= 5 ? 'Average' : 'Needs Improvement'}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Work Commitment</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {stats.overtimeHours > 10 ? 'Dedicated' :
                   stats.overtimeHours > 0 ? 'Committed' : 'Standard'}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Consistency</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {stats.currentStreak >= 10 ? 'Outstanding' :
                   stats.currentStreak >= 5 ? 'Great' :
                   stats.currentStreak >= 2 ? 'Good' : 'Variable'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}