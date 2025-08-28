// components/Employee/Projects/ProjectEditModal.tsx
"use client";
import { useState } from 'react';
import { 
  IProjectUpdateRequest,
  ProjectStatus,
  ProjectPriority,
  ProjectCategory,
  IProjectApiResponse,
  IProject
} from '@/types/projectmanagement';
import {
  X,
  Edit,
  Calendar,
  DollarSign,
  Flag,
  FolderOpen,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Pause,
  Square,
  FileX,
  Loader2,
  Save
} from 'lucide-react';

interface ProjectEditModalProps {
  project: IProject;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProjectEditModal({ project, onClose, onSuccess }: ProjectEditModalProps) {
  const [formData, setFormData] = useState<IProjectUpdateRequest>({
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority,
    startDate: new Date(project.startDate),
    endDate: new Date(project.endDate),
    estimatedHours: project.estimatedHours,
    budget: project.budget,
    category: project.category,
    tags: project.tags || []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusOptions: { value: ProjectStatus; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'planning', label: 'Planning', icon: Clock, color: 'text-blue-600 bg-blue-100' },
    { value: 'in-progress', label: 'In Progress', icon: CheckCircle, color: 'text-yellow-600 bg-yellow-100' },
    { value: 'on-hold', label: 'On Hold', icon: Pause, color: 'text-orange-600 bg-orange-100' },
    { value: 'review', label: 'In Review', icon: AlertTriangle, color: 'text-purple-600 bg-purple-100' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { value: 'cancelled', label: 'Cancelled', icon: FileX, color: 'text-red-600 bg-red-100' }
  ];

  const priorityOptions: { value: ProjectPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-700' }
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

  const validateForm = () => {
    if (!formData.name?.trim()) {
      setError('Project name is required');
      return false;
    }
    if (!formData.description?.trim()) {
      setError('Project description is required');
      return false;
    }
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      setError('End date must be after start date');
      return false;
    }
    if (formData.estimatedHours && formData.estimatedHours < 1) {
      setError('Estimated hours must be at least 1');
      return false;
    }
    if (formData.budget && formData.budget < 0) {
      setError('Budget cannot be negative');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data: IProjectApiResponse<IProject> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update project');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Edit className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Project
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                placeholder="Enter project name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                placeholder="Describe the project goals and requirements..."
              />
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status || 'planning'}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ProjectStatus }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority || 'medium'}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as ProjectPriority }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              >
                {priorityOptions.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value) : undefined }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value) : undefined }))}
                min={formData.startDate?.toISOString().split('T')[0]}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Budget and Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={formData.estimatedHours || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                placeholder="Enter estimated hours"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Budget ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.budget || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || undefined }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                placeholder="Enter project budget"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.category || 'other'}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ProjectCategory }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            >
              {categoryOptions.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              placeholder="e.g., urgent, client-facing, phase-1"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Updating...' : 'Update Project'}
          </button>
        </div>
      </div>
    </div>
  );
}