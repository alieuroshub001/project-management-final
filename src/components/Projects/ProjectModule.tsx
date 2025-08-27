// components/Employee/Projects/ProjectModule.tsx
"use client";
import { useState, useEffect } from 'react';
import ProjectDashboard from './ProjectDashboard';
import ProjectList from './ProjectList';
import ProjectCreate from './ProjectCreate';
import ProjectDetails from './ProjectDetails';
import ProjectCalendar from './ProjectCalendar';
import {
  LayoutDashboard,
  FolderOpen,
  Plus,
  Calendar,
  BarChart3
} from 'lucide-react';

type TabType = 'dashboard' | 'projects' | 'create' | 'calendar' | 'statistics';

interface ProjectModuleProps {
  initialTab?: TabType;
  selectedProjectId?: string;
}

export default function ProjectModule({ initialTab = 'dashboard', selectedProjectId }: ProjectModuleProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(selectedProjectId || null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (selectedProjectId) {
      setCurrentProjectId(selectedProjectId);
      setActiveTab('dashboard');
    }
  }, [selectedProjectId]);

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      description: 'Project overview and stats'
    },
    { 
      id: 'projects', 
      label: 'My Projects', 
      icon: FolderOpen,
      description: 'View all projects'
    },
    { 
      id: 'create', 
      label: 'Create Project', 
      icon: Plus,
      description: 'Start a new project'
    },
    { 
      id: 'calendar', 
      label: 'Calendar', 
      icon: Calendar,
      description: 'Project timeline view'
    },
    { 
      id: 'statistics', 
      label: 'Statistics', 
      icon: BarChart3,
      description: 'Detailed analytics'
    }
  ];

  const handleProjectSelect = (projectId: string) => {
    setCurrentProjectId(projectId);
    setActiveTab('dashboard');
  };

  const handleProjectCreated = () => {
    setActiveTab('projects');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ProjectDashboard 
            selectedProjectId={currentProjectId}
            onProjectSelect={handleProjectSelect}
          />
        );
      case 'projects':
        return (
          <ProjectList 
            onProjectSelect={handleProjectSelect}
          />
        );
      case 'create':
        return (
          <ProjectCreate 
            onSuccess={handleProjectCreated}
          />
        );
      case 'calendar':
        return <ProjectCalendar />;
      case 'statistics':
        return (
          <ProjectDashboard 
            selectedProjectId={currentProjectId}
            onProjectSelect={handleProjectSelect}
            showStatistics={true}
          />
        );
      default:
        return (
          <ProjectDashboard 
            selectedProjectId={currentProjectId}
            onProjectSelect={handleProjectSelect}
          />
        );
    }
  };

  // Show project details if a specific project is selected and not on create tab
  if (currentProjectId && activeTab !== 'create') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={() => setCurrentProjectId(null)}
            className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </button>
        </div>
        
        <ProjectDetails 
          projectId={currentProjectId}
          onBack={() => setCurrentProjectId(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your projects, tasks, and team collaboration
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`group flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <IconComponent className={`w-5 h-5 mr-2 ${
                  activeTab === tab.id 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
}