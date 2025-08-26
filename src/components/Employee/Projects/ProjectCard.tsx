// components/Employee/Projects/ProjectCard.tsx
"use client";
import { IProject, ProjectStatus, ProjectPriority } from '@/types/employee/projectmanagement';
import { formatDate } from '@/utils/dateUtils';
import {
  FolderOpen,
  Calendar,
  Users,
  Clock,
  Target,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Eye
} from 'lucide-react';

interface ProjectCardProps {
  project: IProject;
  onSelect: () => void;
  viewMode: 'grid' | 'list';
  getStatusColor: (status: ProjectStatus) => string;
  getPriorityColor: (priority: ProjectPriority) => string;
}

export default function ProjectCard({ 
  project, 
  onSelect, 
  viewMode, 
  getStatusColor, 
  getPriorityColor 
}: ProjectCardProps) {
  const getStatusIcon = (status: ProjectStatus) => {
    const icons = {
      'planning': Clock,
      'in-progress': PlayCircle,
      'on-hold': PauseCircle,
      'completed': CheckCircle,
      'cancelled': XCircle,
      'review': Eye
    };
    return icons[status] || Clock;
  };

  const getPriorityDot = (priority: ProjectPriority) => {
    const colors = {
      'low': 'bg-green-400',
      'medium': 'bg-yellow-400',
      'high': 'bg-orange-400',
      'critical': 'bg-red-400',
      'urgent': 'bg-red-600'
    };
    return colors[priority] || colors.medium;
  };

  const isOverdue = () => {
    const now = new Date();
    const endDate = new Date(project.endDate);
    return endDate < now && project.status !== 'completed' && project.status !== 'cancelled';
  };

  const daysRemaining = () => {
    const now = new Date();
    const endDate = new Date(project.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const StatusIcon = getStatusIcon(project.status);

  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex-shrink-0 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <FolderOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {project.name}
                </h3>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {project.status.replace('-', ' ')}
                </div>
                <div className={`w-2 h-2 rounded-full ${getPriorityDot(project.priority)}`} title={`${project.priority} priority`} />
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {project.description}
              </p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </div>
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  {project.progress}% complete
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  PM: {project.projectManagerName}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isOverdue() && (
              <div className="flex items-center text-red-600 dark:text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Overdue
              </div>
            )}
            
            <button
              onClick={onSelect}
              className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              View Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className={`w-2 h-2 rounded-full ${getPriorityDot(project.priority)}`} title={`${project.priority} priority`} />
          </div>
          
          {isOverdue() && (
            <div className="flex items-center text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Overdue
            </div>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {project.name}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {project.description}
        </p>

        {/* Status Badge */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${getStatusColor(project.status)}`}>
          <StatusIcon className="w-3 h-3 mr-1.5" />
          {project.status.replace('-', ' ')}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Project Info */}
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Due {formatDate(project.endDate)}</span>
            {!isOverdue() && daysRemaining() <= 7 && daysRemaining() > 0 && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">({daysRemaining()} days left)</span>
            )}
          </div>
          
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            <span>PM: {project.projectManagerName}</span>
          </div>
          
          <div className="flex items-center">
            <Target className="w-4 h-4 mr-2" />
            <span className="capitalize">{project.category.replace('-', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onSelect}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
        >
          View Project Details
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );
}