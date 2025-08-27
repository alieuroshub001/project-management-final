// components/Employee/Leave/LeaveCalendar.tsx
"use client";
import { useState, useEffect } from 'react';
import { ILeave } from '@/types/leave';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isWithinInterval, parseISO } from 'date-fns';

export default function LeaveCalendar() {
  const [leaves, setLeaves] = useState<ILeave[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employee/leave/list?year=${currentDate.getFullYear()}`);
      const data = await response.json();

      if (response.ok) {
        setLeaves(data.data.leaves);
      }
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [currentDate]);

  const getLeaveForDate = (date: Date) => {
    return leaves.find(leave => {
      const startDate = parseISO(leave.startDate.toString());
      const endDate = parseISO(leave.endDate.toString());
      return isWithinInterval(date, { start: startDate, end: endDate }) && leave.status === 'approved';
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-200 border-yellow-300',
      approved: 'bg-green-200 border-green-300',
      rejected: 'bg-red-200 border-red-300',
      cancelled: 'bg-gray-200 border-gray-300'
    };
    return colors[status as keyof typeof colors] || '';
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900/40"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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
          const leave = getLeaveForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`relative min-h-[60px] p-1 border border-gray-100 dark:border-gray-700 ${
                !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/20' : 'bg-white dark:bg-gray-800'
              } ${isTodayDate ? 'ring-2 ring-indigo-500' : ''} ${leave ? getStatusColor(leave.status) : ''}`}
            >
              <div className={`text-sm ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400'} ${isTodayDate ? 'font-bold' : ''}`}>
                {format(day, 'd')}
              </div>
              
              {leave && (
                <div className="mt-1">
                  <div className="text-xs truncate text-gray-700 dark:text-gray-300" title={`${leave.leaveType} - ${leave.status}`}>
                    {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-200 border border-green-300 rounded mr-2"></div>
          <span className="text-gray-600 dark:text-gray-400">Approved</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-200 border border-yellow-300 rounded mr-2"></div>
          <span className="text-gray-600 dark:text-gray-400">Pending</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-200 border border-red-300 rounded mr-2"></div>
          <span className="text-gray-600 dark:text-gray-400">Rejected</span>
        </div>
      </div>
    </div>
  );
}
