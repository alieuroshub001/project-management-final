// components/Employee/Projects/TaskDetailsModal.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  ITaskWithDetails,
  ITaskUpdateRequest,
  TaskStatus,
  TaskPriority,
  ITeamMember
} from '@/types/employee/projectmanagement';
import { formatDate, formatDistanceToNow } from '@/utils/dateUtils';
import {
  X,
  Edit2,
  Clock,
  User,
  CheckCircle,
  Play,
  Pause,
  Square,
  AlertTriangle,
  MessageSquare,
  Paperclip,
  CheckSquare,
  Calendar,
  Flag,
  Loader2,
  Save
} from 'lucide-react';

interface TaskDetailsModalProps {
  projectId: string;
  taskId: string;
  teamMembers: ITeamMember[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function TaskDetailsModal({ 
  projectId, 
  taskId, 
  teamMembers,
  onClose, 
  onSuccess 
}: TaskDetailsModalProps) {
  const [task, setTask] = useState<ITaskWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
  const [editData, setEditData] = useState<ITaskUpdateRequest>({});

  const statusOptions: { value: TaskStatus; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'todo', label: 'To Do', icon: Square, color: 'text-gray-600 bg-gray-100' },
    { value: 'in-progress', label: 'In Progress', icon: Play, color: 'text-blue-600 bg-blue-100' },
    { value: 'in-review', label: 'In Review', icon: Clock, color: 'text-purple-600 bg-purple-100' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { value: 'blocked', label: 'Blocked', icon: AlertTriangle, color: 'text-orange-600 bg-orange-100' },
    { value: 'on-hold', label: 'On Hold', icon: Pause, color: 'text-yellow-600 bg-yellow-100' }
  ];

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-700' }
  ];

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employee/projects/${projectId}/tasks/${taskId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch task');
      }

      setTask(data.data);
      setEditData({
        title: data.data.title,
        description: data.data.description,
        status: data.data.status,
        priority: data.data.priority,
        assignedTo: data.data.assignedTo,
        startDate: data.data.startDate ? new Date(data.data.startDate) : undefined,
        dueDate: data.data.dueDate ? new Date(data.data.dueDate) : undefined,
        estimatedHours: data.data.estimatedHours,
        actualHours: data.data.actualHours,
        progress: data.data.progress,
        category: data.data.category,
        tags: data.data.tags || []
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch task');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [projectId, taskId]);

  const handleUpdate = async () => {
    setUpdating(true);
    setError('');

    try {
      const response = await fetch(`/api/employee/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update task');
      }

      setIsEditing(false);
      await fetchTask();
      onSuccess();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  const toggleChecklistItem = async (itemId: string, isCompleted: boolean) => {
    if (!task) return;

    const updatedChecklist = task.checklist?.map(item => 
      item.id === itemId 
        ? { ...item, isCompleted: !isCompleted }
        : item
    );

    try {
      const response = await fetch(`/api/employee/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: updatedChecklist })
      });

      if (response.ok) {
        await fetchTask();
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to update checklist:', err);
    }
  };

  const getStatusInfo = (status: TaskStatus) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const isOverdue = () => {
    if (!task?.dueDate || task.status === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  };

  const getCompletionPercentage = () => {
    if (!task?.checklist || task.checklist.length === 0) return task?.progress || 0;
    const completed = task.checklist.filter(item => item.isCompleted).length;
    return Math.round((completed / task.checklist.length) * 100);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-xl bg-white dark:bg-gray-800">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading task details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-xl bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Error</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">{error || 'Task not found'}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(task.status);
  const StatusIcon = statusInfo.icon;
  const completionPercentage = getCompletionPercentage();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-6 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-xl bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${statusInfo.color} dark:bg-opacity-20`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Task' : 'Task Details'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {task.category?.replace('-', ' ')} • {task.priority} priority
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Title & Description */}
            <div>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={editData.title || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={editData.description || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-vertical"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {task.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {task.description}
                  </p>
                </div>
              )}
            </div>

            {/* Status & Progress */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Progress & Status</h4>
              
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={editData.status || task.status}
                      onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Progress (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editData.progress || task.progress}
                      onChange={(e) => setEditData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Overall Progress
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {task.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        task.status === 'completed' 
                          ? 'bg-green-600 dark:bg-green-400' 
                          : 'bg-indigo-600 dark:bg-indigo-400'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  
                  {task.checklist && task.checklist.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Checklist Progress
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {task.checklist.filter(item => item.isCompleted).length}/{task.checklist.length} completed
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Checklist */}
            {task.checklist && task.checklist.length > 0 && !isEditing && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Checklist</h4>
                <div className="space-y-2">
                  {task.checklist.map((item) => (
                    <div key={item.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <button
                        onClick={() => toggleChecklistItem(item.id, item.isCompleted)}
                        className={`flex items-center justify-center w-5 h-5 rounded border-2 mr-3 transition-colors ${
                          item.isCompleted
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                        }`}
                      >
                        {item.isCompleted && <CheckSquare className="w-3 h-3" />}
                      </button>
                      <span className={`flex-1 ${
                        item.isCompleted 
                          ? 'text-gray-500 dark:text-gray-400 line-through' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {item.title}
                      </span>
                      {item.isCompleted && item.completedByName && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          ✓ {item.completedByName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments & Activity */}
            {task.comments && task.comments.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Comments ({task.comments.length})
                </h4>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {comment.authorName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Meta */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Task Details</h4>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Priority
                    </label>
                    <select
                      value={editData.priority || task.priority}
                      onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                      className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Assign To
                    </label>
                    <select
                      value={editData.assignedTo || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, assignedTo: e.target.value || undefined }))}
                      className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map(member => (
                        <option key={member.employeeId} value={member.employeeId}>
                          {member.employeeName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={editData.dueDate ? editData.dueDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, dueDate: e.target.value ? new Date(e.target.value) : undefined }))}
                      className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Est. Hours
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={editData.estimatedHours || task.estimatedHours}
                        onChange={(e) => setEditData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Actual Hours
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={editData.actualHours || task.actualHours || 0}
                        onChange={(e) => setEditData(prev => ({ ...prev, actualHours: parseFloat(e.target.value) || 0 }))}
                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {isOverdue() && (
                    <div className="flex items-center text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Overdue</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${statusInfo.color} dark:bg-opacity-20`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Priority</span>
                    <span className={`text-sm font-medium ${priorityOptions.find(p => p.value === task.priority)?.color}`}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  {task.assignedToName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Assigned To</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {task.assignedToName}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(task.createdAt)}
                    </span>
                  </div>
                  
                  {task.dueDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Due Date</span>
                      <span className={`text-sm ${isOverdue() ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white'}`}>
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Time</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {task.actualHours || 0}h / {task.estimatedHours}h
                    </span>
                  </div>
                  
                  {task.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {formatDate(task.completedAt)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</h5>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Paperclip className="w-4 h-4 mr-1" />
                  Attachments ({task.attachments.length})
                </h5>
                <div className="space-y-2">
                  {task.attachments.map((file) => (
                    <a
                      key={file.public_id}
                      href={file.secure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Paperclip className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {file.original_filename}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={updating}
              className={`px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors ${
                updating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {updating ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}