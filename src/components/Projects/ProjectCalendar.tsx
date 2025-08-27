// components/Employee/Projects/ProjectCalendar.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import { IProject } from '@/types/projectmanagement';
import { Calendar, ChevronLeft, ChevronRight, Clock, Target } from 'lucide-react';

interface ProjectCalendarEvent {
  id: string;
  title: string;
  type: 'project-start' | 'project-end' | 'milestone' | 'deadline';
  date: Date;
  project: IProject;
  color: string;
}

export default function ProjectCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ProjectCalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects?limit=50');
      const data = await response.json();

      if (response.ok && data.data) {
        const projectEvents: ProjectCalendarEvent[] = [];
        
        data.data.projects.forEach((project: IProject) => {
          // Add project start date
          projectEvents.push({
            id: `${project.id}-start`,
            title: `${project.name} starts`,
            type: 'project-start',
            date: new Date(project.startDate),
            project,
            color: 'bg-green-500'
          });

          // Add project end date
          projectEvents.push({
            id: `${project.id}-end`,
            title: `${project.name} ends`,
            type: 'project-end',
            date: new Date(project.endDate),
            project,
            color: project.status === 'completed' ? 'bg-blue-500' : 'bg-red-500'
          });
        });

        setEvents(projectEvents);
      }
    } catch (error) {
      console.error('Failed to fetch projects for calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'planning': 'text-blue-600 bg-blue-100',
      'in-progress': 'text-yellow-700 bg-yellow-100',
      'on-hold': 'text-gray-600 bg-gray-100',
      'completed': 'text-green-600 bg-green-100',
      'cancelled': 'text-red-600 bg-red-100',
      'review': 'text-purple-600 bg-purple-100'
    };
    return colors[status as keyof typeof colors] || colors.planning;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Project Calendar
          </h2>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[140px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {monthDays.map(day => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={`relative min-h-[80px] p-2 border border-gray-100 dark:border-gray-700 text-left transition-colors ${
                  !isCurrentMonth 
                    ? 'bg-gray-50 dark:bg-gray-900/20 text-gray-400' 
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                } ${
                  isTodayDate ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : ''
                } ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className={`text-sm font-medium ${
                  isCurrentMonth 
                    ? isTodayDate 
                      ? 'text-indigo-700 dark:text-indigo-300' 
                      : 'text-gray-900 dark:text-white'
                    : 'text-gray-400'
                } mb-1`}>
                  {format(day, 'd')}
                </div>
                
                {/* Events for this day */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event, index) => (
                    <div
                      key={event.id}
                      className={`text-xs px-1 py-0.5 rounded truncate ${
                        event.type === 'project-start' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : event.type === 'project-end'
                          ? event.project.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}
                      title={event.title}
                    >
                      {event.project.name}
                    </div>
                  ))}
                  
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">Project Start</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">Due/Overdue</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Events for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-4">
              {selectedDateEvents.map(event => (
                <div key={event.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-shrink-0">
                    {event.type === 'project-start' ? (
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {event.project.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {event.title}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.project.status)}`}>
                        {event.project.status.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {event.project.progress}% complete
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No events scheduled for this date</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}