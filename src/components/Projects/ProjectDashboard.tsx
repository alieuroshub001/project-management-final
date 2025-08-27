// components/Employee/Projects/ProjectDashboard.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  IProjectDashboard, 
  IProjectStatistics,
  IProjectApiResponse 
} from '@/types/projectmanagement';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProjectQuickActions from './ProjectQuickActions';
import ProjectStats from './ProjectStats';
import RecentActivity from './RecentActivity';
import UpcomingDeadlines from './UpcomingDeadlines';
import ProjectStatistics from './ProjectStatistics';
import {
  FolderOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  Calendar,
  TrendingUp,
  Users
} from 'lucide-react';

interface ProjectDashboardProps {
  selectedProjectId?: string | null;
  onProjectSelect: (projectId: string) => void;
  showStatistics?: boolean;
}

export default function ProjectDashboard({ 
  selectedProjectId, 
  onProjectSelect, 
  showStatistics = false 
}: ProjectDashboardProps) {
  const [dashboard, setDashboard] = useState<IProjectDashboard | null>(null);
  const [statistics, setStatistics] = useState<IProjectStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employee/projects/dashboard');
      const data: IProjectApiResponse<IProjectDashboard> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard');
      }

      setDashboard(data.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employee/projects/dashboard?type=statistics');
      const data: IProjectApiResponse<IProjectStatistics> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch statistics');
      }

      setStatistics(data.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showStatistics) {
      fetchStatistics();
    } else {
      fetchDashboard();
    }
  }, [showStatistics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
          <h3 className="text-lg font-medium text-red-700 dark:text-red-300">Error Loading Dashboard</h3>
        </div>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={() => showStatistics ? fetchStatistics() : fetchDashboard()}
          className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (showStatistics && statistics) {
    return <ProjectStatistics statistics={statistics} />;
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Dashboard Data</h3>
        <p className="text-gray-500 dark:text-gray-400">Unable to load dashboard information.</p>
      </div>
    );
  }

  const overviewStats = [
    {
      title: 'Total Projects',
      value: dashboard.totalProjects,
      icon: FolderOpen,
      color: 'indigo',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Active Projects',
      value: dashboard.activeProjects,
      icon: Activity,
      color: 'green',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Completed Projects',
      value: dashboard.completedProjects,
      icon: CheckCircle,
      color: 'emerald',
      change: '+15%',
      changeType: 'increase'
    },
    {
      title: 'Overdue Projects',
      value: dashboard.overdueProjects,
      icon: AlertTriangle,
      color: 'red',
      change: '-5%',
      changeType: 'decrease'
    }
  ];

  const taskStats = [
    {
      title: 'Total Tasks',
      value: dashboard.totalTasks,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Completed Tasks',
      value: dashboard.completedTasks,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Overdue Tasks',
      value: dashboard.overdueTasks,
      icon: Clock,
      color: 'amber'
    },
    {
      title: 'Hours Logged',
      value: Math.round(dashboard.totalTimeLogged / 60),
      icon: TrendingUp,
      color: 'purple',
      suffix: 'hrs'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        text: 'text-indigo-600 dark:text-indigo-400'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        text: 'text-green-600 dark:text-green-400'
      },
      emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        icon: 'text-emerald-600 dark:text-emerald-400',
        text: 'text-emerald-600 dark:text-emerald-400'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-600 dark:text-red-400'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-600 dark:text-blue-400'
      },
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        icon: 'text-amber-600 dark:text-amber-400',
        text: 'text-amber-600 dark:text-amber-400'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        text: 'text-purple-600 dark:text-purple-400'
      }
    };
    return colors[color as keyof typeof colors] || colors.indigo;
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <ProjectQuickActions />

      {/* Overview Stats */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Project Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewStats.map((stat, index) => {
            const IconComponent = stat.icon;
            const colorClasses = getColorClasses(stat.color);
            
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
                      <IconComponent className={`w-6 h-6 ${colorClasses.icon}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
                {stat.change && (
                  <div className="mt-4 flex items-center">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Stats */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Task Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {taskStats.map((stat, index) => {
            const IconComponent = stat.icon;
            const colorClasses = getColorClasses(stat.color);
            
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
                    <IconComponent className={`w-5 h-5 ${colorClasses.icon}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {stat.value}{stat.suffix || ''}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity and Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivity activities={dashboard.recentActivity} />
        <UpcomingDeadlines deadlines={dashboard.upcomingDeadlines} />
      </div>

      {/* Project Stats */}
      <ProjectStats />
    </div>
  );
}