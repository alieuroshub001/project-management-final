// components/Employee/Projects/TimeTrackingModal.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  ITimeEntryCreateRequest,
  ITimeEntry,
  ITask,
  IProjectApiResponse
} from '@/types/projectmanagement';
import {
  X,
  Clock,
  Play,
  Pause,
  Square,
  CheckSquare,
  Calendar,
  User,
  DollarSign,
  Timer,
  Loader2,
  Save
} from 'lucide-react';

interface TimeTrackingModalProps {
  projectId: string;
  tasks: ITask[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function TimeTrackingModal({ 
  projectId, 
  tasks, 
  onClose, 
  onSuccess 
}: TimeTrackingModalProps) {
  const [formData, setFormData] = useState<ITimeEntryCreateRequest>({
    projectId,
    description: '',
    startTime: new Date(),
    isBillable: true
  });

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const startTimer = () => {
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);
    setFormData(prev => ({ ...prev, startTime: now }));
    setElapsedTime(0);
  };

  const stopTimer = () => {
    if (startTime) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // in minutes
      setFormData(prev => ({ 
        ...prev, 
        endTime,
        duration: Math.max(1, duration) // Minimum 1 minute
      }));
    }
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setStartTime(null);
    setFormData(prev => ({ 
      ...prev, 
      startTime: new Date(),
      endTime: undefined,
      duration: undefined
    }));
  };

  const validateForm = () => {
    if (!formData.description?.trim()) {
      setError('Time entry description is required');
      return false;
    }
    if (formData.description.length < 5) {
      setError('Description must be at least 5 characters long');
      return false;
    }
    if (!formData.duration && !formData.endTime) {
      setError('Please stop the timer or enter duration manually');
      return false;
    }
    if (formData.duration && formData.duration < 1) {
      setError('Duration must be at least 1 minute');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/${projectId}/time-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data: IProjectApiResponse<ITimeEntry> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create time entry');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create time entry');
    } finally {
      setLoading(false);
    }
  };

  const manualDurationMinutes = formData.duration || Math.floor(elapsedTime / 60);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Timer className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Track Time
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-4">
              {formatTime(elapsedTime)}
            </div>
            
            <div className="flex items-center justify-center gap-3">
              {!isRunning ? (
                <button
                  onClick={startTimer}
                  className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start
                </button>
              ) : (
                <button
                  onClick={stopTimer}
                  className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Stop
                </button>
              )}
              
              <button
                onClick={resetTimer}
                disabled={isRunning}
                className="flex items-center px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Square className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Task Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task (Optional)
              </label>
              <select
                value={formData.taskId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, taskId: e.target.value || undefined }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              >
                <option value="">General project work</option>
                {tasks.filter(task => task.status !== 'completed').map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors resize-none"
                placeholder="What did you work on? Be specific..."
              />
            </div>

            {/* Manual Time Entry */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime.toISOString().slice(0, 16)}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: new Date(e.target.value) }))}
                  disabled={isRunning}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={manualDurationMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || undefined }))}
                  disabled={isRunning}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Billable Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Billable Time
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This time can be charged to the client
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isBillable}
                  onChange={(e) => setFormData(prev => ({ ...prev, isBillable: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Time Summary */}
            {manualDurationMinutes > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800 dark:text-blue-200">Total Time:</span>
                  <span className="font-semibold text-blue-900 dark:text-blue-100">
                    {formatDuration(manualDurationMinutes)}
                  </span>
                </div>
                {formData.isBillable && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-blue-800 dark:text-blue-200">Billable:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      Yes
                    </span>
                  </div>
                )}
              </div>
            )}
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
            disabled={loading || isRunning || manualDurationMinutes === 0}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Saving...' : 'Save Time Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}