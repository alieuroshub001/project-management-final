// components/Employee/Projects/ProjectTasks.tsx (Updated with complete integration)
"use client";
import { useState, useEffect } from 'react';
import { ITask, IProjectApiResponse, ITeamMember } from '@/types/projectmanagement';
import { formatDate } from '@/utils/dateUtils';
import TaskCreateModal from './TaskCreationModal';
import TaskDetailsModal from './TaskDetailModal';
import {
  CheckSquare,
  Plus,
  Filter,
  Search,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Eye,
  Edit,
  MoreVertical,
  Flag
} from 'lucide-react';

interface ProjectTasksProps {
  projectId: string;
  tasks?: ITask[];
  teamMembers?: ITeamMember[];
  onRefresh: () => void;
}

export default function ProjectTasks({ 
  projectId, 
  tasks = [], 
  teamMembers = [], 
  onRefresh 
}: ProjectTasksProps) {
  const [filteredTasks, setFilteredTasks] = useState<ITask[]>(tasks || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showTaskActions, setShowTaskActions] = useState<string | null>(null);

  useEffect(() => {
    const safeTasks = tasks || [];
    let filtered = safeTasks;

    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const getStatusIcon = (status: string) => {
    const icons = {
      'todo': Clock,
      'in-progress': PlayCircle,
      'in-review': CheckCircle,
      'completed': CheckCircle,
      'cancelled': XCircle,
      'blocked': AlertTriangle,
      'on-hold': PauseCircle
    };
    return icons[status as keyof typeof icons] || Clock;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'todo': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
      'in-review': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
      'completed': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
      'cancelled': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
      'blocked': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
      'on-hold': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
    };
    return colors[status as keyof typeof colors] || colors['todo'];
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'text-green-600 dark:text-green-400',
      'medium': 'text-yellow-600 dark:text-yellow-400',
      'high': 'text-orange-600 dark:text-orange-400',
      'critical': 'text-red-600 dark:text-red-400',
      'urgent': 'text-red-700 dark:text-red-500'
    };
    return colors[priority as keyof typeof colors] || colors['medium'];
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Tasks' },
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'in-review', label: 'In Review' },
    { value: 'completed', label: 'Completed' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'on-hold', label: 'On Hold' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const quickStatusActions = [
    { status: 'todo', label: 'Mark as To Do', icon: Clock },
    { status: 'in-progress', label: 'Start Task', icon: PlayCircle },
    { status: 'in-review', label: 'Submit for Review', icon: Eye },
    { status: 'completed', label: 'Mark Complete', icon: CheckCircle },
    { status: 'on-hold', label: 'Put on Hold', icon: PauseCircle }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tasks
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
          </div>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
        >
          {priorityOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {tasks.length === 0 
              ? 'Get started by creating your first task for this project.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {tasks.length === 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const StatusIcon = getStatusIcon(task.status);
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
            
            return (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <StatusIcon className="w-5 h-5 text-gray-400" />
                      <h3 
                        className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium border rounded ${getStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                      {task.priority && (
                        <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                      )}
                      {isOverdue && (
                        <span className="flex items-center text-red-600 dark:text-red-400 text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Overdue
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      {task.assignedToName && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          <span>{task.assignedToName}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>Due {formatDate(task.dueDate)}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Flag className="w-4 h-4 mr-1" />
                        <span>{task.progress}% complete</span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedTaskId(task.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={() => setShowTaskActions(showTaskActions === task.id ? null : task.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {showTaskActions === task.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                          <button
                            onClick={() => {
                              setSelectedTaskId(task.id);
                              setShowTaskActions(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                          >
                            <Edit className="w-4 h-4 mr-3" />
                            Edit Task
                          </button>
                          
                          {quickStatusActions
                            .filter(action => action.status !== task.status)
                            .slice(0, 3)
                            .map((action) => {
                              const ActionIcon = action.icon;
                              return (
                                <button
                                  key={action.status}
                                  onClick={() => {
                                    updateTaskStatus(task.id, action.status);
                                    setShowTaskActions(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                                >
                                  <ActionIcon className="w-4 h-4 mr-3" />
                                  {action.label}
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <TaskCreateModal
          projectId={projectId}
          teamMembers={teamMembers}
          existingTasks={tasks}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            onRefresh();
          }}
        />
      )}

      {selectedTaskId && (
        <TaskDetailsModal
          projectId={projectId}
          taskId={selectedTaskId}
          teamMembers={teamMembers}
          onClose={() => setSelectedTaskId(null)}
          onSuccess={() => {
            setSelectedTaskId(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}