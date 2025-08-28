// components/Employee/Projects/MilestoneEditModal.tsx
"use client";
import { useState } from 'react';
import { 
  IMilestone,
  IMilestoneUpdateRequest,
  MilestoneStatus,
  ITask,
  IProjectApiResponse
} from '@/types/projectmanagement';
import {
  X,
  Edit,
  Calendar,
  Target,
  CheckSquare,
  AlertTriangle,
  Loader2,
  Save,
  Flag,
  Clock,
  CheckCircle,
  Pause,
  XCircle
} from 'lucide-react';

interface MilestoneEditModalProps {
  milestone: IMilestone;
  projectId: string;
  tasks: ITask[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function MilestoneEditModal({ 
  milestone, 
  projectId, 
  tasks, 
  onClose, 
  onSuccess 
}: MilestoneEditModalProps) {
  const [formData, setFormData] = useState<IMilestoneUpdateRequest>({
    title: milestone.title,
    description: milestone.description,
    dueDate: new Date(milestone.dueDate),
    status: milestone.status,
    tasks: milestone.tasks || []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>(milestone.tasks || []);

  const statusOptions: { value: MilestoneStatus; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'pending', label: 'Pending', icon: Clock, color: 'text-gray-600 bg-gray-100' },
    { value: 'in-progress', label: 'In Progress', icon: Flag, color: 'text-blue-600 bg-blue-100' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { value: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-100' }
  ];

  const availableTasks = tasks.filter(task => task.status !== 'completed');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSelection = prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId];
      
      setFormData(prevData => ({
        ...prevData,
        tasks: newSelection
      }));
      
      return newSelection;
    });
  };

  const calculateProgress = () => {
    if (selectedTasks.length === 0) return 0;
    const completedSelected = selectedTasks.filter(taskId => 
      tasks.find(task => task.id === taskId && task.status === 'completed')
    ).length;
    return Math.round((completedSelected / selectedTasks.length) * 100);
  };

  const validateForm = () => {
    if (!formData.title?.trim()) {
      setError('Milestone title is required');
      return false;
    }
    if (formData.title.length < 3) {
      setError('Milestone title must be at least 3 characters long');
      return false;
    }
    if (!formData.description?.trim()) {
      setError('Milestone description is required');
      return false;
    }
    if (formData.description.length < 10) {
      setError('Milestone description must be at least 10 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/${projectId}/milestones/${milestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data: IProjectApiResponse<IMilestone> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update milestone');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    const updateData = {
      ...formData,
      status: 'completed' as MilestoneStatus,
      completedAt: new Date()
    };

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/${projectId}/milestones/${milestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data: IProjectApiResponse<IMilestone> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete milestone');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete milestone');
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
            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Milestone
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {calculateProgress()}% completed
              </p>
            </div>
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
                Milestone Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                placeholder="Enter milestone title..."
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
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors resize-none"
                placeholder="Describe what needs to be achieved for this milestone..."
              />
            </div>
          </div>

          {/* Status and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status || 'pending'}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as MilestoneStatus }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
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
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Progress Overview */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Target className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" />
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Progress Preview</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {calculateProgress()}%
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-300">
              Based on selected tasks ({selectedTasks.length} tasks selected)
            </div>
          </div>

          {/* Task Association */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Associated Tasks (Optional)
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select tasks that must be completed to achieve this milestone. Completed tasks will contribute to milestone progress.
            </p>

            {tasks.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Tasks Available</h4>
                <p className="text-gray-500 dark:text-gray-400">
                  Create some tasks first to associate them with this milestone.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Available Tasks */}
                {availableTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Available Tasks ({availableTasks.length})
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      {availableTasks.map(task => (
                        <label
                          key={task.id}
                          className="flex items-start p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            className="mt-1 mr-3 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-900 dark:text-white truncate">
                                {task.title}
                              </h5>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                task.status === 'todo' ? 'bg-gray-100 text-gray-700' :
                                task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                task.status === 'in-review' ? 'bg-purple-100 text-purple-700' :
                                task.status === 'blocked' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {task.status.replace('-', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                            {task.assignedToName && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Assigned to: {task.assignedToName}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Completed Tasks ({completedTasks.length})
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      {completedTasks.map(task => (
                        <label
                          key={task.id}
                          className="flex items-start p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg cursor-pointer opacity-75"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            className="mt-1 mr-3 text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-900 dark:text-white truncate">
                                {task.title}
                              </h5>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                              {task.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {milestone.status !== 'completed' && (
              <button
                onClick={handleMarkComplete}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
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
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Updating...' : 'Update Milestone'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}