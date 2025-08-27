// components/Employee/Projects/MilestoneCreateModal.tsx
"use client";
import { useState } from 'react';
import { 
  IMilestoneCreateRequest,
  ITask,
  IProjectApiResponse
} from '@/types/projectmanagement';
import {
  X,
  Trophy,
  Calendar,
  Target,
  CheckSquare,
  AlertCircle,
  Loader2,
  Flag
} from 'lucide-react';

interface MilestoneCreateModalProps {
  projectId: string;
  tasks: ITask[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function MilestoneCreateModal({ 
  projectId, 
  tasks, 
  onClose, 
  onSuccess 
}: MilestoneCreateModalProps) {
  const [formData, setFormData] = useState<IMilestoneCreateRequest>({
    projectId,
    title: '',
    description: '',
    dueDate: new Date(),
    tasks: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

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

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Milestone title is required');
      return false;
    }
    if (formData.title.length < 3) {
      setError('Milestone title must be at least 3 characters long');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Milestone description is required');
      return false;
    }
    if (formData.description.length < 10) {
      setError('Milestone description must be at least 10 characters long');
      return false;
    }
    if (new Date(formData.dueDate) <= new Date()) {
      setError('Due date must be in the future');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/${projectId}/milestones`, {
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
      console.error('Create milestone error:', err);
      if (err instanceof Error) {
        if (err.message.includes('non-JSON response')) {
          setError('Server error: Please check if the milestone creation API endpoint exists and is working correctly.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to create milestone');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatusColor = (status: string) => {
    const colors = {
      'todo': 'text-gray-600 bg-gray-100',
      'in-progress': 'text-blue-600 bg-blue-100',
      'in-review': 'text-purple-600 bg-purple-100',
      'completed': 'text-green-600 bg-green-100',
      'blocked': 'text-orange-600 bg-orange-100',
      'on-hold': 'text-yellow-600 bg-yellow-100'
    };
    return colors[status as keyof typeof colors] || colors.todo;
  };

  const calculateProgress = () => {
    if (selectedTasks.length === 0) return 0;
    const completedSelected = selectedTasks.filter(taskId => {
      const task = tasks.find(t => t.id === taskId);
      return task?.status === 'completed';
    }).length;
    return Math.round((completedSelected / selectedTasks.length) * 100);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-xl bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-4">
              <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create Milestone</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Set a significant project achievement</p>
            </div>
          </div>
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
          {/* Milestone Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Milestone Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter milestone title..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                maxLength={255}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this milestone represents and its significance to the project..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors resize-vertical"
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.description.length}/1000 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  required
                  value={formData.dueDate.toISOString().split('T')[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-end">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 w-full">
                <div className="flex items-center mb-2">
                  <Target className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Progress Preview</span>
                </div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {calculateProgress()}%
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300">
                  Based on selected tasks
                </div>
              </div>
            </div>
          </div>

          {/* Task Association */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Associated Tasks (Optional)
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select tasks that must be completed to achieve this milestone. This helps track progress automatically.
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
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                      <Flag className="w-4 h-4 mr-2" />
                      Available Tasks ({availableTasks.length})
                    </h4>
                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      {availableTasks.map((task) => (
                        <label
                          key={task.id}
                          className={`flex items-start cursor-pointer p-3 rounded-lg border transition-all ${
                            selectedTasks.includes(task.id)
                              ? 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mt-1"
                          />
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-gray-900 dark:text-white truncate">
                                  {task.title}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)} dark:bg-opacity-20`}>
                                  {task.status.replace('-', ' ')}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                              {task.assignedToName && (
                                <span>Assigned to: {task.assignedToName}</span>
                              )}
                              <span className={`font-medium ${
                                task.priority === 'urgent' || task.priority === 'critical' 
                                  ? 'text-red-600 dark:text-red-400'
                                  : task.priority === 'high'
                                  ? 'text-orange-600 dark:text-orange-400' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {task.priority} priority
                              </span>
                              <span>{task.estimatedHours}h estimated</span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                      <CheckSquare className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                      Completed Tasks ({completedTasks.length})
                    </h4>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/30">
                      {completedTasks.map((task) => (
                        <label
                          key={task.id}
                          className={`flex items-start cursor-pointer p-3 rounded-lg border transition-all ${
                            selectedTasks.includes(task.id)
                              ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500 mt-1"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-700 dark:text-gray-300 line-through">
                                {task.title}
                              </h5>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                <CheckSquare className="w-3 h-3 mr-1" />
                                Completed
                              </span>
                            </div>
                            {task.completedAt && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                Completed on {new Date(task.completedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selection Summary */}
                {selectedTasks.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                      Selection Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-purple-700 dark:text-purple-300">Selected:</span>
                        <div className="font-semibold text-purple-900 dark:text-purple-100">
                          {selectedTasks.length} tasks
                        </div>
                      </div>
                      <div>
                        <span className="text-purple-700 dark:text-purple-300">Completed:</span>
                        <div className="font-semibold text-purple-900 dark:text-purple-100">
                          {selectedTasks.filter(taskId => {
                            const task = tasks.find(t => t.id === taskId);
                            return task?.status === 'completed';
                          }).length} tasks
                        </div>
                      </div>
                      <div>
                        <span className="text-purple-700 dark:text-purple-300">Progress:</span>
                        <div className="font-semibold text-purple-900 dark:text-purple-100">
                          {calculateProgress()}%
                        </div>
                      </div>
                      <div>
                        <span className="text-purple-700 dark:text-purple-300">Est. Hours:</span>
                        <div className="font-semibold text-purple-900 dark:text-purple-100">
                          {selectedTasks.reduce((total, taskId) => {
                            const task = tasks.find(t => t.id === taskId);
                            return total + (task?.estimatedHours || 0);
                          }, 0)}h
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
            <h4 className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Milestone Preview
            </h4>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-purple-700 dark:text-purple-300">Title:</span>
                <p className="font-medium text-purple-900 dark:text-purple-100">
                  {formData.title || 'Enter milestone title...'}
                </p>
              </div>
              <div>
                <span className="text-sm text-purple-700 dark:text-purple-300">Due Date:</span>
                <p className="font-medium text-purple-900 dark:text-purple-100">
                  {formData.dueDate.toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-purple-700 dark:text-purple-300">Associated Tasks:</span>
                <p className="font-medium text-purple-900 dark:text-purple-100">
                  {selectedTasks.length} tasks selected
                </p>
              </div>
              {selectedTasks.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-purple-700 dark:text-purple-300">Current Progress:</span>
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-100">{calculateProgress()}%</span>
                  </div>
                  <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                    <div
                      className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress()}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-3 border border-transparent rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                Creating...
              </div>
            ) : (
              <div className="flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                Create Milestone
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}