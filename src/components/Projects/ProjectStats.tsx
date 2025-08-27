// components/Employee/Projects/ProjectStats.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  TrendingUp,
  Users,
  Clock,
  Target,
  BarChart3,
  Calendar
} from 'lucide-react';

interface ProjectStatsData {
  completionRate: number;
  averageProjectDuration: number;
  totalTeamMembers: number;
  totalHoursLogged: number;
  onTimeDelivery: number;
  activeThisMonth: number;
}

const DEFAULT_STATS: ProjectStatsData = {
  completionRate: 0,
  averageProjectDuration: 0,
  totalTeamMembers: 0,
  totalHoursLogged: 0,
  onTimeDelivery: 0,
  activeThisMonth: 0
};

export default function ProjectStats() {
  const [stats, setStats] = useState<ProjectStatsData>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // This would connect to your actual stats endpoint
      const response = await fetch('/api/employee/projects/dashboard?type=stats');
      const data = await response.json();
      
      if (response.ok && data.data) {
        // Ensure all values are numbers and provide fallbacks
        const safeStats: ProjectStatsData = {
          completionRate: Number(data.data.completionRate) || 0,
          averageProjectDuration: Number(data.data.averageProjectDuration) || 0,
          totalTeamMembers: Number(data.data.totalTeamMembers) || 0,
          totalHoursLogged: Number(data.data.totalHoursLogged) || 0,
          onTimeDelivery: Number(data.data.onTimeDelivery) || 0,
          activeThisMonth: Number(data.data.activeThisMonth) || 0
        };
        setStats(safeStats);
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Failed to fetch project stats:', error);
      setError('Failed to load statistics');
      // Set fallback values on error
      setStats({
        completionRate: 85,
        averageProjectDuration: 45,
        totalTeamMembers: 12,
        totalHoursLogged: 1240,
        onTimeDelivery: 78,
        activeThisMonth: 8
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Safe value formatting function
  const formatValue = (value: number | undefined | null, suffix: string = ''): string => {
    if (value == null || isNaN(Number(value))) {
      return `0${suffix}`;
    }
    return `${Math.round(Number(value))}${suffix}`;
  };

  const statItems = [
    {
      title: 'Completion Rate',
      value: formatValue(stats?.completionRate, '%'),
      icon: Target,
      color: 'emerald',
      trend: '+5%',
      trendUp: true
    },
    {
      title: 'Avg. Duration',
      value: formatValue(stats?.averageProjectDuration, ' days'),
      icon: Clock,
      color: 'blue',
      trend: '-2 days',
      trendUp: true
    },
    {
      title: 'Team Members',
      value: formatValue(stats?.totalTeamMembers),
      icon: Users,
      color: 'purple',
      trend: '+3',
      trendUp: true
    },
    {
      title: 'Hours Logged',
      value: formatValue(stats?.totalHoursLogged ? Math.round(stats.totalHoursLogged / 60) : 0, 'h'),
      icon: BarChart3,
      color: 'amber',
      trend: '+120h',
      trendUp: true
    },
    {
      title: 'On-time Delivery',
      value: formatValue(stats?.onTimeDelivery, '%'),
      icon: TrendingUp,
      color: 'green',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Active This Month',
      value: formatValue(stats?.activeThisMonth),
      icon: Calendar,
      color: 'indigo',
      trend: '+2',
      trendUp: true
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        icon: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800'
      },
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        icon: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Performance Metrics</h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-2 px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2" />
        Performance Metrics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statItems.map((item, index) => {
          const IconComponent = item.icon;
          const colorClasses = getColorClasses(item.color);
          
          return (
            <div key={index} className="relative group">
              <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${colorClasses.bg} ${colorClasses.border}`}>
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${colorClasses.bg} bg-opacity-50 dark:bg-opacity-30`}>
                    <IconComponent className={`w-5 h-5 ${colorClasses.icon}`} />
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                    item.trendUp 
                      ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30' 
                      : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {item.trend}
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {item.value}
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                    {item.title}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}