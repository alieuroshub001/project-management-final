// components/Employee/Projects/ProjectList.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  IProject, 
  IProjectApiResponse, 
  ProjectStatus, 
  ProjectPriority, 
  ProjectCategory 
} from '@/types/projectmanagement';
import ProjectCard from './ProjectCard';
import ProjectFilters from './ProjectFilters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Search, 
  Filter,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  GridIcon,
  ListIcon
} from 'lucide-react';

interface ProjectListProps {
  onProjectSelect: (projectId: string) => void;
}

export default function ProjectList({ onProjectSelect }: ProjectListProps) {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filters
  const [filters, setFilters] = useState({
    status: [] as ProjectStatus[],
    priority: [] as ProjectPriority[],
    category: [] as ProjectCategory[],
    isArchived: false
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(searchQuery && { query: searchQuery }),
        ...(filters.status.length > 0 && { status: filters.status.join(',') }),
        ...(filters.priority.length > 0 && { priority: filters.priority.join(',') }),
        ...(filters.category.length > 0 && { category: filters.category.join(',') }),
        isArchived: filters.isArchived.toString()
      });

      const response = await fetch(`/api/projects?${params}`);
      const data: IProjectApiResponse<{
        projects: IProject[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        }
      }> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch projects');
      }

      if (data.data) {
        setProjects(data.data.projects);
        setTotalPages(data.data.pagination.totalPages);
        setTotalProjects(data.data.pagination.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, filters, searchQuery]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filtering
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const getStatusColor = (status: ProjectStatus) => {
    const colors = {
      'planning': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      'on-hold': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      'review': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
    };
    return colors[status] || colors.planning;
  };

  const getPriorityColor = (priority: ProjectPriority) => {
    const colors = {
      'low': 'text-green-600 dark:text-green-400',
      'medium': 'text-yellow-600 dark:text-yellow-400',
      'high': 'text-orange-600 dark:text-orange-400',
      'critical': 'text-red-600 dark:text-red-400',
      'urgent': 'text-red-700 dark:text-red-300'
    };
    return colors[priority] || colors.medium;
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 dark:text-gray-400">Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {totalProjects} project{totalProjects !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <GridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <ProjectFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={fetchProjects}
            className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            Try again
          </button>
        </div>
      )}

      {/* Projects Grid/List */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No projects found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {searchQuery || filters.status.length > 0 || filters.priority.length > 0 || filters.category.length > 0
              ? 'No projects match your current search and filters. Try adjusting your criteria.'
              : 'You haven\'t been assigned to any projects yet.'}
          </p>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={() => onProjectSelect(project.id)}
              viewMode={viewMode}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages} • {totalProjects} total projects
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}