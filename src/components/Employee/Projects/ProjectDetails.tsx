// components/Employee/Projects/ProjectDetails.tsx (Complete)
"use client";
import { useState, useEffect } from 'react';
import { 
  IProjectWithDetails,
  IProjectApiResponse 
} from '@/types/employee/projectmanagement';
import { formatDate } from '@/utils/dateUtils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProjectOverview from './ProjectOverview';
import ProjectTasks from './ProjectTasks';
import ProjectTeam from './ProjectTeam';
import ProjectFiles from './ProjectFiles';
import ProjectTimeline from './ProjectTimeline';
import {
  ArrowLeft,
  LayoutDashboard,
  CheckSquare,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  Edit,
  Archive,
  Share2,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  DollarSign
} from 'lucide-react';

interface ProjectDetailsProps {
  projectId: string;
  onBack: () => void;
}

type DetailTab = 'overview' | 'tasks' | 'team' | 'files' | 'timeline' | 'analytics';

export default function ProjectDetails({ projectId, onBack }: ProjectDetailsProps) {
  const [project, setProject] = useState<IProjectWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showActions, setShowActions] = useState(false);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/employee/projects/${projectId}`);
      const data: IProjectApiResponse<IProjectWithDetails> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch project');
      }

      setProject(data.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const tabs = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: LayoutDashboard,
      description: 'Project summary and key metrics'
    },
    { 
      id: 'tasks', 
      label: 'Tasks', 
      icon: CheckSquare,
      description: 'Task management and progress'
    },
    { 
      id: 'team', 
      label: 'Team', 
      icon: Users,
      description: 'Team members and permissions'
    },
    { 
      id: 'files', 
      label: 'Files', 
      icon: FileText,
      description: 'Project documents and attachments'
    },
    { 
      id: 'timeline', 
      label: 'Timeline', 
      icon: Calendar,
      description: 'Project timeline and milestones'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3,
      description: 'Detailed project analytics'
    }
  ];

  const getStatusIcon = (status: string) => {
    const icons = {
      'planning': Clock,
      'in-progress': CheckSquare,
      'on-hold': AlertTriangle,
      'completed': CheckCircle,
      'cancelled': AlertTriangle,
      'review': CheckCircle
    };
    return icons[status as keyof typeof icons] || Clock;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'planning': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
      'on-hold': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
      'completed': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
      'cancelled': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
      'review': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
    };
    return colors[status as keyof typeof colors] || colors.planning;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'text-green-600 dark:text-green-400',
      'medium': 'text-yellow-600 dark:text-yellow-400',
      'high': 'text-orange-600 dark:text-orange-400',
      'critical': 'text-red-600 dark:text-red-400',
      'urgent': 'text-red-700 dark:text-red-300'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const isOverdue = () => {
    if (!project) return false;
    const now = new Date();
    const endDate = new Date(project.endDate);
    return endDate < now && project.status !== 'completed' && project.status !== 'cancelled';
  };

  const daysRemaining = () => {
    if (!project) return 0;
    const now = new Date();
    const endDate = new Date(project.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderTabContent = () => {
    if (!project) return null;

    switch (activeTab) {
      case 'overview':
        return <ProjectOverview project={project} onRefresh={fetchProject} />;
      case 'tasks':
        return <ProjectTasks projectId={project.id} tasks={project.tasks} onRefresh={fetchProject} />;
      case 'team':
        return <ProjectTeam projectId={project.id} teamMembers={project.teamMembers} onRefresh={fetchProject} />;
      case 'files':
        return <ProjectFiles projectId={project.id} attachments={project.attachments} onRefresh={fetchProject} />;
      case 'timeline':
        return <ProjectTimeline project={project} />;
      case 'analytics':
        return <ProjectOverview project={project} onRefresh={fetchProject} showAnalytics={true} />;
      default:
        return <ProjectOverview project={project} onRefresh={fetchProject} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <LoadingSpinner size="lg" />
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading project details...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-4">Unable to Load Project</h2>
          <p className="text-red-600 dark:text-red-400 mb-6 leading-relaxed">
            {error || 'The requested project could not be found or you may not have permission to access it.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchProject}
              className="px-6 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Go Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(project.status);

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <button
          onClick={onBack}
          className="flex items-center hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Projects
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white truncate">
                    {project.name}
                  </h1>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                    <StatusIcon className="w-4 h-4 mr-2" />
                    {project.status.replace('-', ' ').toUpperCase()}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4 line-clamp-2">
                {project.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>PM: <span className="font-medium text-gray-900 dark:text-white">{project.projectManagerName}</span></span>
                </div>
                <div className="flex items-center">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  <span>{project.completedTasks}/{project.totalTasks} tasks completed</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{Math.round(project.totalTimeSpent / 60)} hours logged</span>
                </div>
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  <span className={`font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority.toUpperCase()} priority
                  </span>
                </div>
              </div>
            </div>
            
            {/* Progress and Actions */}
            <div className="flex flex-col items-end space-y-4">
              {/* Progress Circle */}
              <div className="text-right">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{project.progress}%</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Complete</div>
                  </div>
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${project.progress * 1.76} 176`}
                        className="text-indigo-600 dark:text-indigo-400"
                      />
                    </svg>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isOverdue() ? (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      Overdue by {Math.abs(daysRemaining())} days
                    </span>
                  ) : daysRemaining() > 0 ? (
                    <span>{daysRemaining()} days remaining</span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400 font-medium">Completed</span>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
                <button className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Project
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {showActions && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center">
                        <Settings className="w-4 h-4 mr-3" />
                        Project Settings
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center">
                        <Archive className="w-4 h-4 mr-3" />
                        Archive Project
                      </button>
                      <hr className="border-gray-200 dark:border-gray-700 my-1" />
                      <button className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-3" />
                        Delete Project
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {formatDate(project.startDate)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Start Date</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {formatDate(project.endDate)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">End Date</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {project.estimatedHours}h
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Estimated</div>
            </div>
            
            {project.budget && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 mr-1" />
                  {project.budget.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Budget</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Alert */}
      {isOverdue() && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-xl">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Project Overdue</h3>
              <p className="text-red-600 dark:text-red-400 mt-1">
                This project was due {Math.abs(daysRemaining())} days ago. Consider updating the timeline or project status.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DetailTab)}
                  className={`group flex items-center px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 min-w-0 ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 mr-3 flex-shrink-0 ${
                    isActive 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                  }`} />
                  <div className="text-left min-w-0">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 hidden sm:block">
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}