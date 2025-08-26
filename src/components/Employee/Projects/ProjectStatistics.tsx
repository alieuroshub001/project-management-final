// components/Employee/Projects/ProjectStatistics.tsx
"use client";
import { IProjectStatistics } from '@/types/employee/projectmanagement';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Clock,
  Target,
  Calendar,
  Award
} from 'lucide-react';

interface ProjectStatisticsProps {
  statistics: IProjectStatistics;
}

export default function ProjectStatistics({ statistics }: ProjectStatisticsProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      'planning': 'bg-blue-500',
      'in-progress': 'bg-yellow-500',
      'on-hold': 'bg-gray-500',
      'completed': 'bg-green-500',
      'cancelled': 'bg-red-500',
      'review': 'bg-purple-500'
    };
    return colors[status as keyof typeof colors] || colors.planning;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-green-400',
      'medium': 'bg-yellow-400',
      'high': 'bg-orange-400',
      'critical': 'bg-red-400',
      'urgent': 'bg-red-600'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Duration</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.averageProjectDuration} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Task Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.averageTaskCompletionTime} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.mostActiveUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.monthlyProgress.length} months</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Projects by Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Projects by Status
          </h3>
          <div className="space-y-4">
            {Object.entries(statistics.projectsByStatus).map(([status, count]) => {
              const total = Object.values(statistics.projectsByStatus).reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks by Priority */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Tasks by Priority
          </h3>
          <div className="space-y-4">
            {Object.entries(statistics.tasksByPriority).map(([priority, count]) => {
              const total = Object.values(statistics.tasksByPriority).reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
              
              return (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {priority}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Most Active Users */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Award className="w-5 h-5 mr-2" />
          Most Active Team Members
        </h3>
        
        {statistics.mostActiveUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statistics.mostActiveUsers.slice(0, 6).map((user, index) => (
              <div key={user.userId} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {user.userName}
                  </h4>
                  <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300 px-2 py-1 rounded-full">
                    #{index + 1}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Activities:</span>
                    <span className="font-medium">{user.activitiesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time logged:</span>
                    <span className="font-medium">{Math.round(user.timeLogged / 60)}h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No user activity data available</p>
          </div>
        )}
      </div>

      {/* Monthly Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Monthly Progress Trends
        </h3>
        
        {statistics.monthlyProgress.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-6 gap-4 min-w-full">
              {statistics.monthlyProgress.map((month) => (
                <div key={month.month} className="text-center">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      {month.month}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Projects</div>
                        <div className="font-bold text-green-600 dark:text-green-400">
                          {month.projectsCompleted}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Tasks</div>
                        <div className="font-bold text-blue-600 dark:text-blue-400">
                          {month.tasksCompleted}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Hours</div>
                        <div className="font-bold text-purple-600 dark:text-purple-400">
                          {month.hoursLogged}h
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No monthly progress data available</p>
          </div>
        )}
      </div>

      {/* Category Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Projects by Category
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(statistics.projectsByCategory).map(([category, count]) => (
            <div key={category} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                {count}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                {category.replace('-', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}