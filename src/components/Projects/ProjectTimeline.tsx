// components/Employee/Projects/ProjectTimeline.tsx
"use client";
import { IProjectWithDetails } from '@/types/projectmanagement';
import { formatDate, formatDistanceToNow } from '@/utils/dateUtils';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText,
  Target,
  Activity,
  Flag,
  GitCommit
} from 'lucide-react';

interface ProjectTimelineProps {
  project: IProjectWithDetails;
}

interface TimelineEvent {
  id: string;
  type: 'project' | 'task' | 'milestone' | 'activity';
  date: Date;
  title: string;
  description: string;
  status?: string;
  priority?: string;
  icon: React.ElementType;
  color: string;
}

export default function ProjectTimeline({ project }: ProjectTimelineProps) {
  // Generate timeline events from project data
  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Add project start
    events.push({
      id: `project-start-${project.id}`,
      type: 'project',
      date: new Date(project.startDate),
      title: 'Project Started',
      description: `${project.name} project was initiated`,
      icon: Flag,
      color: 'bg-blue-500'
    });

    // Add project end (planned or actual)
    events.push({
      id: `project-end-${project.id}`,
      type: 'project',
      date: new Date(project.endDate),
      title: project.status === 'completed' ? 'Project Completed' : 'Project Due',
      description: project.status === 'completed' ? 'Project was successfully completed' : 'Project deadline',
      status: project.status,
      icon: project.status === 'completed' ? CheckCircle : Clock,
      color: project.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'
    });

    // Add completed tasks
    project.tasks
      .filter(task => task.status === 'completed' && task.completedAt)
      .forEach(task => {
        events.push({
          id: `task-${task.id}`,
          type: 'task',
          date: new Date(task.completedAt!),
          title: 'Task Completed',
          description: task.title,
          status: task.status,
          priority: task.priority,
          icon: CheckCircle,
          color: 'bg-emerald-500'
        });
      });

    // Add completed milestones
    project.milestones
      .filter(milestone => milestone.status === 'completed' && milestone.completedAt)
      .forEach(milestone => {
        events.push({
          id: `milestone-${milestone.id}`,
          type: 'milestone',
          date: new Date(milestone.completedAt!),
          title: 'Milestone Reached',
          description: milestone.title,
          status: milestone.status,
          icon: Target,
          color: 'bg-purple-500'
        });
      });

    // Add recent activities (limited to significant ones)
    project.recentActivity
      .filter(activity => ['project-created', 'project-completed', 'milestone-completed', 'member-added'].includes(activity.activityType))
      .slice(0, 10)
      .forEach(activity => {
        events.push({
          id: `activity-${activity.id}`,
          type: 'activity',
          date: new Date(activity.createdAt),
          title: activity.activityType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: activity.description,
          icon: Activity,
          color: 'bg-gray-500'
        });
      });

    // Sort events by date
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const timelineEvents = generateTimelineEvents();
  const currentDate = new Date();

  const isEventInFuture = (event: TimelineEvent) => {
    return event.date > currentDate && event.type === 'project';
  };

  const isEventOverdue = (event: TimelineEvent) => {
    return event.date < currentDate && 
           event.type === 'project' && 
           event.title.includes('Due') && 
           project.status !== 'completed';
  };

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Timeline Data</h3>
        <p className="text-gray-500 dark:text-gray-400">Timeline will be populated as project activities occur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Project Timeline
        </h2>
        
        {/* Progress Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {timelineEvents.filter(e => e.type === 'project').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Milestones</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {timelineEvents.filter(e => e.type === 'task' && e.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasks Done</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {timelineEvents.filter(e => e.type === 'milestone' && e.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Milestones</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {timelineEvents.filter(e => e.type === 'activity').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Activities</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
          
          <div className="space-y-6">
            {timelineEvents.map((event, index) => {
              const IconComponent = event.icon;
              const isCurrentEvent = index === timelineEvents.findIndex(e => e.date > currentDate);
              const isFuture = isEventInFuture(event);
              const isOverdue = isEventOverdue(event);
              
              return (
                <div key={event.id} className="relative flex items-start">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 ${event.color} ${
                    isFuture ? 'opacity-50' : ''
                  } ${isCurrentEvent ? 'ring-4 ring-blue-200 dark:ring-blue-800' : ''}`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 ml-6">
                    <div className={`bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 ${
                      isFuture ? 'opacity-75' : ''
                    } ${isOverdue ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className={`text-lg font-semibold ${
                              isOverdue ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-white'
                            }`}>
                              {event.title}
                            </h3>
                            
                            {event.type === 'task' && event.priority && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.priority === 'urgent' || event.priority === 'critical' 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                  : event.priority === 'high'
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                              }`}>
                                {event.priority.toUpperCase()}
                              </span>
                            )}
                            
                            {isOverdue && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Overdue
                              </span>
                            )}
                            
                            {isFuture && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                <Clock className="w-3 h-3 mr-1" />
                                Upcoming
                              </span>
                            )}
                          </div>
                          
                          <p className={`text-sm mb-3 ${
                            isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {event.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{formatDate(event.date)}</span>
                            </div>
                            
                            {event.date <= currentDate && (
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>{formatDistanceToNow(event.date, { addSuffix: true })}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <span className="capitalize bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full text-xs">
                                {event.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Completion Timeline</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Project Duration</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Days Elapsed</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.max(0, Math.ceil((currentDate.getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)))} days
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Days Remaining</span>
              <span className={`font-medium ${
                new Date(project.endDate) < currentDate && project.status !== 'completed'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {Math.ceil((new Date(project.endDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</span>
                <span className="font-medium text-gray-900 dark:text-white">{project.progress}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Event Summary</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Completed Events</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {timelineEvents.filter(e => e.date <= currentDate && !e.title.includes('Due')).length}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Upcoming Events</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {timelineEvents.filter(e => e.date > currentDate).length}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Overdue Events</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {timelineEvents.filter(e => isEventOverdue(e)).length}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Milestones</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {project.milestones.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}