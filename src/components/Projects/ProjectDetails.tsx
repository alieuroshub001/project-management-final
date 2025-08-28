// components/Employee/Projects/ProjectDetails.tsx (Updated with complete integration)
"use client";
import { useState, useEffect } from 'react';
import { 
  IProjectWithDetails,
  IProjectApiResponse 
} from '@/types/projectmanagement';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProjectOverview from './ProjectOverview';
import ProjectTasks from './ProjectTasks';
import ProjectTeam from './ProjectTeam';
import ProjectFiles from './ProjectFiles';
import ProjectTimeline from './ProjectTimeline';
import ProjectEditModal from './ProjectEditModal';
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
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/projects/${projectId}`);
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
      'on-hold': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
      'review': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
      'completed': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
      'cancelled': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
    };
    return colors[status as keyof typeof colors] || colors['planning'];
  };

  const handleArchiveProject = async () => {
    if (!project) return;
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true })
      });

      if (response.ok) {
        fetchProject(); // Refresh project data
      }
    } catch (err) {
      console.error('Failed to archive project:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Unable to Load Project
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error || 'Project not found or you may not have access to view it.'}
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(project.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <StatusIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.name}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs font-medium border rounded ${getStatusColor(project.status)}`}>
                  {project.status.replace('-', ' ').toUpperCase()}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {project.category.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <button
                onClick={() => {
                  setShowEditModal(true);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <Edit className="w-4 h-4 mr-3" />
                Edit Project
              </button>
              <button
                onClick={() => {
                  handleArchiveProject();
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <Archive className="w-4 h-4 mr-3" />
                Archive Project
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                <Share2 className="w-4 h-4 mr-3" />
                Share Project
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                <Settings className="w-4 h-4 mr-3" />
                Project Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DetailTab)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <ProjectOverview project={project} onRefresh={fetchProject} />
          )}
          
          {activeTab === 'tasks' && (
            <ProjectTasks 
              projectId={project.id}
              tasks={project.tasks}
              teamMembers={project.teamMembers}
              onRefresh={fetchProject}
            />
          )}
          
          {activeTab === 'team' && (
            <ProjectTeam 
              projectId={project.id}
              teamMembers={project.teamMembers || []}
              onRefresh={fetchProject}
            />
          )}
          
          {activeTab === 'files' && (
            <ProjectFiles 
              projectId={project.id}
              files={project.attachments || []}
              onRefresh={fetchProject}
            />
          )}
          
          {activeTab === 'timeline' && (
            <ProjectTimeline project={project} />
          )}
          
          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Analytics Coming Soon
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Detailed project analytics and reporting will be available here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <ProjectEditModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchProject}
        />
      )}
    </div>
  );
}