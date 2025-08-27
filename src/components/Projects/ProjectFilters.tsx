// components/Employee/Projects/ProjectFilters.tsx
"use client";
import { 
  ProjectStatus, 
  ProjectPriority, 
  ProjectCategory 
} from '@/types/projectmanagement';
import { X, Filter } from 'lucide-react';

interface ProjectFiltersProps {
  filters: {
    status: ProjectStatus[];
    priority: ProjectPriority[];
    category: ProjectCategory[];
    isArchived: boolean;
  };
  onFilterChange: (filters: {
    status: ProjectStatus[];
    priority: ProjectPriority[];
    category: ProjectCategory[];
    isArchived: boolean;
  }) => void;
}

export default function ProjectFilters({ filters, onFilterChange }: ProjectFiltersProps) {
  const statusOptions: { value: ProjectStatus; label: string; color: string }[] = [
    { value: 'planning', label: 'Planning', color: 'blue' },
    { value: 'in-progress', label: 'In Progress', color: 'yellow' },
    { value: 'on-hold', label: 'On Hold', color: 'gray' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
    { value: 'review', label: 'In Review', color: 'purple' }
  ];

  const priorityOptions: { value: ProjectPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'critical', label: 'Critical', color: 'red' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];

  const categoryOptions: { value: ProjectCategory; label: string }[] = [
    { value: 'web-development', label: 'Web Development' },
    { value: 'mobile-app', label: 'Mobile App' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'research', label: 'Research' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'testing', label: 'Testing' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'other', label: 'Other' }
  ];

  const handleStatusChange = (status: ProjectStatus, checked: boolean) => {
    const newStatus = checked 
      ? [...filters.status, status]
      : filters.status.filter(s => s !== status);
    
    onFilterChange({
      ...filters,
      status: newStatus
    });
  };

  const handlePriorityChange = (priority: ProjectPriority, checked: boolean) => {
    const newPriority = checked 
      ? [...filters.priority, priority]
      : filters.priority.filter(p => p !== priority);
    
    onFilterChange({
      ...filters,
      priority: newPriority
    });
  };

  const handleCategoryChange = (category: ProjectCategory, checked: boolean) => {
    const newCategory = checked 
      ? [...filters.category, category]
      : filters.category.filter(c => c !== category);
    
    onFilterChange({
      ...filters,
      category: newCategory
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      status: [],
      priority: [],
      category: [],
      isArchived: false
    });
  };

  const hasActiveFilters = filters.status.length > 0 || 
                          filters.priority.length > 0 || 
                          filters.category.length > 0 || 
                          filters.isArchived;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filter Projects
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Status Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Status</h4>
          <div className="space-y-2">
            {statusOptions.map(option => (
              <label key={option.value} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.status.includes(option.value)}
                  onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Priority</h4>
          <div className="space-y-2">
            {priorityOptions.map(option => (
              <label key={option.value} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.priority.includes(option.value)}
                  onChange={(e) => handlePriorityChange(option.value, e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Category</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categoryOptions.map(option => (
              <label key={option.value} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.category.includes(option.value)}
                  onChange={(e) => handleCategoryChange(option.value, e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Archive Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Other</h4>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.isArchived}
                onChange={(e) => onFilterChange({ ...filters, isArchived: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                Include Archived
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {filters.status.map(status => (
              <span key={status} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                {statusOptions.find(s => s.value === status)?.label}
                <button
                  onClick={() => handleStatusChange(status, false)}
                  className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {filters.priority.map(priority => (
              <span key={priority} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                {priorityOptions.find(p => p.value === priority)?.label}
                <button
                  onClick={() => handlePriorityChange(priority, false)}
                  className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {filters.category.map(category => (
              <span key={category} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                {categoryOptions.find(c => c.value === category)?.label}
                <button
                  onClick={() => handleCategoryChange(category, false)}
                  className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {filters.isArchived && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
                Archived
                <button
                  onClick={() => onFilterChange({ ...filters, isArchived: false })}
                  className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}