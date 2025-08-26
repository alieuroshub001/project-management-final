// components/Employee/Attendance/AttendanceCalendar.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  isSameDay
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Coffee,
  Users,
  Target,
  TrendingUp,
  BarChart3
} from 'lucide-react';

type CalendarView = 'month' | 'week' | 'day';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  totalWorkingMinutes: number;
  totalBreakMinutes: number;
  totalNamazMinutes: number;
  tasksCompleted: any[];
  isLate: boolean;
  isEarlyDeparture: boolean;
  summary?: {
    productivityScore: number;
  };
}

interface CalendarDay {
  date: Date;
  attendance?: AttendanceRecord;
  isWorkingDay: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  isInCurrentMonth: boolean;
  status: string;
}

interface CalendarData {
  days?: CalendarDay[];
  weeks?: any[];
  month?: any;
  week?: any;
}

export default function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<CalendarView>('month');
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        view: viewType,
        year: currentDate.getFullYear().toString(),
        month: (currentDate.getMonth() + 1).toString(),
      });

      if (viewType === 'week') {
        const weekNumber = Math.ceil(currentDate.getDate() / 7);
        params.append('week', weekNumber.toString());
      } else if (viewType === 'day') {
        params.append('date', currentDate.toISOString());
      }

      const response = await fetch(`/api/employee/attendance/calendar?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCalendarData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch calendar data');
      }
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewType === 'month') {
        newDate.setMonth(direction === 'prev' ? prev.getMonth() - 1 : prev.getMonth() + 1);
      } else if (viewType === 'week') {
        newDate.setDate(direction === 'prev' ? prev.getDate() - 7 : prev.getDate() + 7);
      } else {
        newDate.setDate(direction === 'prev' ? prev.getDate() - 1 : prev.getDate() + 1);
      }
      return newDate;
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      present: 'bg-green-100 border-green-300 text-green-800',
      late: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      absent: 'bg-red-100 border-red-300 text-red-800',
      'half-day': 'bg-orange-100 border-orange-300 text-orange-800',
      'early-departure': 'bg-blue-100 border-blue-300 text-blue-800',
      'no-record': 'bg-gray-100 border-gray-300 text-gray-600'
    };
    return colors[status as keyof typeof colors] || colors['no-record'];
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      present: CheckCircle,
      late: AlertCircle,
      absent: XCircle,
      'half-day': Clock,
      'early-departure': Clock,
      'no-record': CalendarIcon
    };
    return icons[status as keyof typeof icons] || CalendarIcon;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getDayTitle = () => {
    if (viewType === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (viewType === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, viewType]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
        <div className="bg-gray-200 dark:bg-gray-700 h-96 rounded-lg"></div>
      </div>
    );
  }

  const renderMonthView = () => {
    if (!calendarData?.month) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Month Stats */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {calendarData.month.monthlyStats.presentDays}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Present Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(calendarData.month.monthlyStats.attendancePercentage)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Attendance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatTime(Math.round(calendarData.month.monthlyStats.totalHours * 60))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {calendarData.month.monthlyStats.totalTasks}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(calendarData.month.monthlyStats.punctualityPercentage)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Punctuality</div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarData.month.weeks.flatMap((week: any) => 
              week.days.map((day: CalendarDay, index: number) => {
                const StatusIcon = getStatusIcon(day.status);
                return (
                  <button
                    key={`${week.weekNumber}-${index}`}
                    onClick={() => setSelectedDay(day)}
                    className={`relative min-h-[80px] p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-sm transition-shadow ${
                      !day.isInCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/20 opacity-50' : 'bg-white dark:bg-gray-800'
                    } ${isToday(day.date) ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    <div className="flex flex-col h-full">
                      <div className={`text-sm font-medium mb-1 ${
                        day.isInCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                      } ${isToday(day.date) ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                        {format(day.date, 'd')}
                      </div>
                      
                      {day.attendance && (
                        <div className="flex-1 space-y-1">
                          <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(day.status)}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {day.status.charAt(0).toUpperCase() + day.status.slice(1)}
                          </div>
                          
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(day.attendance.totalWorkingMinutes)}
                          </div>
                          
                          {day.attendance.tasksCompleted.length > 0 && (
                            <div className="text-xs text-indigo-600 dark:text-indigo-400">
                              {day.attendance.tasksCompleted.length} tasks
                            </div>
                          )}
                        </div>
                      )}
                      
                      {day.isWeekend && !day.attendance && (
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-xs text-gray-400">Weekend</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    if (!calendarData?.week) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Week Stats */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {calendarData.week.weeklyStats.presentDays}/{calendarData.week.weeklyStats.totalDays}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Present Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatTime(Math.round(calendarData.week.weeklyStats.totalHours * 60))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {calendarData.week.weeklyStats.totalTasks}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatTime(Math.round(calendarData.week.weeklyStats.averageHours * 60))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Avg/Day</div>
            </div>
          </div>
        </div>

        {/* Week Days */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {calendarData.week.days.map((day: CalendarDay, index: number) => {
              const StatusIcon = getStatusIcon(day.status);
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDay(day)}
                  className={`p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-sm transition-shadow ${
                    isToday(day.date) ? 'ring-2 ring-indigo-500' : ''
                  } ${day.isWeekend ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-800'}`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {format(day.date, 'EEE d')}
                  </div>
                  
                  {day.attendance ? (
                    <div className="space-y-2">
                      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(day.status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {day.status}
                      </div>
                      
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatTime(day.attendance.totalWorkingMinutes)}
                      </div>
                      
                      <div className="text-xs text-indigo-600 dark:text-indigo-400">
                        {day.attendance.tasksCompleted.length} tasks
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      {day.isWeekend ? 'Weekend' : 'No Record'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    if (!calendarData?.day) return null;

    const dayData = calendarData.day;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {format(dayData.date, 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className={`text-sm mt-1 ${getStatusColor(dayData.status)}`}>
              Status: {dayData.status.charAt(0).toUpperCase() + dayData.status.slice(1)}
            </p>
          </div>
          {dayData.summary && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {dayData.summary.productivityScore}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Productivity Score</div>
            </div>
          )}
        </div>

        {dayData.summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                {dayData.summary.workingHours.toFixed(1)}h
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Working Hours</div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
              <Coffee className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                {dayData.summary.breakTime.toFixed(1)}h
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Break Time</div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {dayData.summary.namazTime.toFixed(1)}h
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Prayer Time</div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-green-900 dark:text-green-100">
                {dayData.summary.tasksCompleted}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Tasks Completed</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {dayData.isWeekend ? 'Weekend - No work scheduled' : 'No attendance record for this day'}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
            {getDayTitle()}
          </h2>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900/40"
          >
            Today
          </button>
          
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['month', 'week', 'day'] as CalendarView[]).map(view => (
              <button
                key={view}
                onClick={() => setViewType(view)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewType === view
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Views */}
      {viewType === 'month' && renderMonthView()}
      {viewType === 'week' && renderWeekView()}
      {viewType === 'day' && renderDayView()}

      {/* Day Details Modal */}
      {selectedDay && selectedDay.attendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {format(selectedDay.date, 'MMMM d, yyyy')}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedDay.status)}`}>
                {getStatusIcon(selectedDay.status)({ className: "w-4 h-4 mr-2" })}
                {selectedDay.status.charAt(0).toUpperCase() + selectedDay.status.slice(1)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Working Time:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatTime(selectedDay.attendance.totalWorkingMinutes)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Break Time:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatTime(selectedDay.attendance.totalBreakMinutes)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Prayer Time:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatTime(selectedDay.attendance.totalNamazMinutes)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Tasks:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDay.attendance.tasksCompleted.length}
                  </p>
                </div>
              </div>

              {selectedDay.attendance.summary && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Productivity Score:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div 
                          className="h-2 bg-indigo-500 rounded-full" 
                          style={{ width: `${selectedDay.attendance.summary.productivityScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedDay.attendance.summary.productivityScore}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}