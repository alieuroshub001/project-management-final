// components/Employee/Attendance/AttendanceCalendar.tsx
"use client";
import { useState, useEffect } from 'react';
import { IAttendance } from '@/types/employee/attendance';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Coffee
} from 'lucide-react';

export default function AttendanceCalendar() {
  const [attendances, setAttendances] = useState<IAttendance[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(currentDate).toISOString().split('T')[0];
      const endDate = endOfMonth(currentDate).toISOString().split('T')[0];
      
      const response = await fetch(`/api/employee/attendance/history?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();

      if (response.ok) {
        setAttendances(data.data.attendances);
      }
    } catch (err) {
      console.error('Failed to fetch attendances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [currentDate]);

  const getAttendanceForDate = (date: Date) => {
    return attendances.find(attendance => {
      const attendanceDate = parseISO(attendance.date.toString());
      return (
        attendanceDate.getDate() === date.getDate() &&
        attendanceDate.getMonth() === date.getMonth() &&
        attendanceDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      present: CheckCircle,
      absent: XCircle,
      late: AlertCircle,
      'early-departure': AlertCircle,
      'on-break': Coffee
    };
    return icons[status as keyof typeof icons] || null;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      late: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
      'early-departure': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      'on-break': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthDays.map(day => {
          const attendance = getAttendanceForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const StatusIcon = attendance ? getStatusIcon(attendance.status) : null;

          return (
            <div
              key={day.toISOString()}
              className={`relative min-h-[80px] p-2 border rounded-lg ${
                !isCurrentMonth 
                  ? 'bg-gray-50 dark:bg-gray-900/20 text-gray-400' 
                  : isTodayDate
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className={`text-sm font-medium ${
                !isCurrentMonth ? 'text-gray-400' : 
                isTodayDate ? 'text-indigo-600 dark:text-indigo-400' : 
                'text-gray-900 dark:text-white'
              }`}>
                {format(day, 'd')}
              </div>
              
              {attendance && StatusIcon && (
                <div className="mt-1">
                  <div className={`flex items-center justify-center p-1 rounded text-xs ${getStatusColor(attendance.status)}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    <span>{attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1).replace('-', ' ')}</span>
                  </div>
                  {attendance.totalHours > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                      {attendance.totalHours}h
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
          <span className="text-gray-600 dark:text-gray-400">Present</span>
        </div>
        <div className="flex items-center">
          <XCircle className="w-4 h-4 text-red-500 mr-2" />
          <span className="text-gray-600 dark:text-gray-400">Absent</span>
        </div>
        <div className="flex items-center">
          <AlertCircle className="w-4 h-4 text-amber-500 mr-2" />
          <span className="text-gray-600 dark:text-gray-400">Late/Early</span>
        </div>
        <div className="flex items-center">
          <Coffee className="w-4 h-4 text-blue-500 mr-2" />
          <span className="text-gray-600 dark:text-gray-400">On Break</span>
        </div>
      </div>
    </div>
  );
}