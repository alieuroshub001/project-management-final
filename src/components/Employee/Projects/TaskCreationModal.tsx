// components/Employee/Projects/TaskCreateModal.tsx
"use client";
import { useState } from 'react';
import { 
  ITaskCreateRequest, 
  TaskPriority, 
  TaskCategory,
  ITeamMember,
  ITask,
  ICloudinaryFile
} from '@/types/employee/projectmanagement';
import {
  X,
  Plus,
  Calendar,
  Clock,
  User,
  FileText,
  Tag,
  CheckSquare,
  Upload,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface TaskCreateModalProps {
  projectId: string;
  teamMembers: ITeamMember[];
  existingTasks: ITask[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function TaskCreateModal({ 
  projectId, 
  teamMembers, 
  existingTasks,
  onClose, 
  onSuccess 
}: TaskCreateModalProps) {
  const [formData, setFormData] = useState<ITaskCreateRequest>({
    projectId,
    title: '',
    description: '',
    priority: 'medium',
    estimatedHours: 8,
    category: 'development',
    tags: [],
    dependencies: [],
    cloudinaryAttachments: [],
    checklist: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [checklistInput, setChecklistInput] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-700' }
  ];

  const categoryOptions: { value: TaskCategory; label: string }[] = [
    { value: 'development', label: 'Development' },
    { value: 'design', label: 'Design' },
    { value: 'testing', label: 'Testing' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'review', label: 'Review' },
    { value: 'deployment', label: 'Deployment' },
    { value: 'bug-fix', label: 'Bug Fix' },
    { value: 'feature', label: 'Feature' },
    { value: 'research', label: 'Research' },
    { value: 'meeting', label: 'Meeting' }
  ];

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploadingFiles(true);
    const uploadFormData = new FormData();
    
    Array.from(files).forEach(file => {
      uploadFormData.append('files', file);
    });
    uploadFormData.append('projectId', projectId);

    try {
      const response = await fetch('/api/employee/projects/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setFormData(prev => ({
        ...prev,
        cloudinaryAttachments: [...(prev.cloudinaryAttachments || []), ...data.files]
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed');
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeAttachment = (publicId: string) => {
    setFormData(prev => ({
      ...prev,
      cloudinaryAttachments: prev.cloudinaryAttachments?.filter(file => file.public_id !== publicId)
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
  };

  const addChecklistItem = () => {
    if (checklistInput.trim()) {
      const newItem = {
        title: checklistInput.trim(),
        isCompleted: false
      };
      
      setFormData(prev => ({
        ...prev,
        checklist: [...(prev.checklist || []), newItem]
      }));
      setChecklistInput('');
    }
  };

  const removeChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist?.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Task title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Task description is required');
      return false;
    }
    if (formData.estimatedHours <= 0) {
      setError('Estimated hours must be greater than 0');
      return false;
    }
    if (formData.startDate && formData.dueDate) {
      if (new Date(formData.dueDate) <= new Date(formData.startDate)) {
        setError('Due date must be after start date');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/employee/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      onSuccess();
      onClose();

    } catch (err) {
      console.error('Create task error:', err);
      if (err instanceof Error) {
        if (err.message.includes('non-JSON response')) {
          setError('Server error: Please check if the task creation API endpoint exists and is working correctly.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to create task');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-xl bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Task</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              maxLength={255}
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the task objectives and requirements..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-vertical"
              maxLength={2000}
            />
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as TaskCategory }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignment and Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign To
              </label>
              <select
                value={formData.assignedTo || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value || undefined }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              >
                <option value="">Unassigned</option>
                {teamMembers && teamMembers.length > 0 ? (
                  teamMembers.map(member => (
                    <option key={member.id} value={member.employeeId}>
                      {member.employeeName} ({member.role})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No team members available</option>
                )}
              </select>
              {(!teamMembers || teamMembers.length === 0) && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Add team members to the project to assign tasks
                </p>
              )}
            </div>

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
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value ? new Date(e.target.value) : undefined }))}
                min={formData.startDate?.toISOString().split('T')[0]}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Estimated Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estimated Hours <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0.5"
              max="500"
              step="0.5"
              value={formData.estimatedHours}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
          </div>

          {/* Dependencies */}
          {(existingTasks || []).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dependencies (Tasks that must be completed first)
              </label>
              <select
                multiple
                value={formData.dependencies || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData(prev => ({ ...prev, dependencies: selected }));
                }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                size={4}
              >
                {(existingTasks || []).map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.status})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Hold Ctrl/Cmd to select multiple tasks
              </p>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag..."
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-1 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Checklist Items
            </label>
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="text"
                value={checklistInput}
                onChange={(e) => setChecklistInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                placeholder="Add checklist item..."
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              />
              <button
                type="button"
                onClick={addChecklistItem}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {formData.checklist && formData.checklist.length > 0 && (
              <div className="space-y-2">
                {formData.checklist.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center">
                      <CheckSquare className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-700 dark:text-gray-300">{item.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attachments
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              <input
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                id="task-file-upload"
                disabled={uploadingFiles}
              />
              <label
                htmlFor="task-file-upload"
                className={`cursor-pointer ${uploadingFiles ? 'cursor-not-allowed' : ''}`}
              >
                {uploadingFiles ? (
                  <div className="text-center">
                    <Loader2 className="animate-spin w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Click to upload files
                    </p>
                  </div>
                )}
              </label>
            </div>

            {formData.cloudinaryAttachments && formData.cloudinaryAttachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.cloudinaryAttachments.map((file) => (
                  <div key={file.public_id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.original_filename}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.public_id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || uploadingFiles}
              className={`px-6 py-3 border border-transparent rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors ${
                loading || uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  Creating...
                </div>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}