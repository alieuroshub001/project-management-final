// components/Employee/Projects/ProjectOverview.tsx (Enhanced with modals)
"use client";
import { useState } from 'react';
import { IProjectWithDetails } from '@/types/projectmanagement';
import { formatDate, formatDistanceToNow } from '@/utils/dateUtils';
import ProjectEditModal from './ProjectEditModal';
import TaskCreateModal from './TaskCreationModal';
import TeamMemberAddModal from './TeamMemberAddModal';
import MilestoneCreateModal from './MileStoneCreateModal';
import TimeTrackingModal from './TimeTrackingModal';
import {
  Calendar,
  Clock,
  Users,
  CheckSquare,
  DollarSign,
  Target,
  TrendingUp,
  FileText,
  Plus,
  Edit,
  Timer,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';

interface ProjectOverviewProps {
  project: IProjectWithDetails;
  onRefresh: () => void;
}

export default function ProjectOverview({ project, onRefresh }: ProjectOverviewProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  // Calculate project metrics
  const completedTasks = project.tasks?.filter(task => task.status === 'completed').length || 0;
  const totalTasks = project.tasks?.length || 0;
  const tasksProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const overdueTasks = project.tasks?.filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
  ).length || 0;

  const completedMilestones = project.milestones?.filter(milestone => 
    milestone.status === 'completed'
  ).length || 0;
  const totalMilestones = project.milestones?.length || 0;

  const activeTeamMembers = project.teamMembers?.filter(member => member.isActive).length || 0;

  const isOverdue = new Date(project.endDate) < new Date() && project.status !== 'completed';
  const daysUntilDeadline = Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));

  const getStatusColor = (status: string) => {
    const colors = {
      'planning': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
      'on-hold': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
      'review': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
      'completed': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
      'cancelled': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
    };
    return colors[status as keyof typeof colors] || colors['planning'];
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'text-green-600 dark:text-green-400',
      'medium': 'text-yellow-600 dark:text-yellow-400',
      'high': 'text-orange-600 dark:text-orange-400',
      'critical': 'text-red-600 dark:text-red-400',
      'urgent': 'text-red-700 dark:text-red-500'
    };
    return colors[priority as keyof typeof colors] || colors['medium'];
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.name}
              </h1>
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-3">
              <span className={`px-3 py-1 text-sm font-medium border rounded-lg ${getStatusColor(project.status)}`}>
                {project.status.replace('-', ' ').toUpperCase()}
              </span>
              <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                {project.priority.toUpperCase()} PRIORITY
              </span>
              {isOverdue && (
                <span className="flex items-center text-red-600 dark:text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Overdue
                </span>
              )}
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {project.description}
            </p>

            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>
                  {daysUntilDeadline > 0 ? `${daysUntilDeadline} days remaining` : 'Deadline passed'}
                </span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>{activeTeamMembers} team members</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Progress
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {project.progress || tasksProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress || tasksProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {completedTasks}/{totalTasks}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Tasks</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {completedMilestones}/{totalMilestones}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Milestones</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className={`text-2xl font-bold ${overdueTasks > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {overdueTasks}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {overdueTasks > 0 ? 'Overdue' : 'On Track'}
            </div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(project.totalTimeSpent || 0)}h
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Time Logged</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <button 
            onClick={() => setShowTaskModal(true)}
            className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors group"
          >
            <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Add Task
            </span>
          </button>

          <button 
            onClick={() => setShowTeamModal(true)}
            className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 rounded-lg transition-colors group"
          >
            <Users className="w-6 h-6 text-green-600 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Add Member
            </span>
          </button>

          <button 
            onClick={() => setShowMilestoneModal(true)}
            className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 rounded-lg transition-colors group"
          >
            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Add Milestone
            </span>
          </button>

          <button 
            onClick={() => setShowTimeModal(true)}
            className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-800 rounded-lg transition-colors group"
          >
            <Timer className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Track Time
            </span>
          </button>

          <button className="flex flex-col items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors group">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
              Upload File
            </span>
          </button>
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Project Details
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Project Manager:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {project.projectManagerName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Category:</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {project.category.replace('-', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Estimated Hours:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {project.estimatedHours}h
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Actual Hours:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round(project.totalTimeSpent || 0)}h
              </span>
            </div>
            {project.budget && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Budget:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${project.budget.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Created:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(project.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          {project.recentActivity && project.recentActivity.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {project.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Activity className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{activity.performedByName}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDistanceToNow(activity.createdAt)} ago</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditModal && (
        <ProjectEditModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSuccess={onRefresh}
        />
      )}

      {showTaskModal && (
        <TaskCreateModal
          projectId={project.id}
          teamMembers={project.teamMembers || []}
          existingTasks={project.tasks || []}
          onClose={() => setShowTaskModal(false)}
          onSuccess={onRefresh}
        />
      )}

      {showTeamModal && (
        <TeamMemberAddModal
          projectId={project.id}
          onClose={() => setShowTeamModal(false)}
          onSuccess={onRefresh}
        />
      )}

      {showMilestoneModal && (
        <MilestoneCreateModal
          projectId={project.id}
          tasks={project.tasks || []}
          onClose={() => setShowMilestoneModal(false)}
          onSuccess={onRefresh}
        />
      )}

      {showTimeModal && (
        <TimeTrackingModal
          projectId={project.id}
          tasks={project.tasks || []}
          onClose={() => setShowTimeModal(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}