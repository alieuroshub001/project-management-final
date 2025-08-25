// components/Employee/Attendance/AttendanceTaskManager.tsx
"use client";
import { useState, useEffect } from 'react';
import { IAttendance } from '@/types/employee/attendance';
import AttendanceTasks from './AttendanceTasks';

export default function AttendanceTaskManager() {
  const [todayAttendance, setTodayAttendance] = useState<IAttendance | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch('/api/employee/attendance/today');
      if (response.ok) {
        const data = await response.json();
        setTodayAttendance(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch today\'s attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Task Management
        </h2>
        
        {todayAttendance && (
          <AttendanceTasks
            attendanceId={todayAttendance._id}
            tasks={todayAttendance.tasks || []}
            onTasksUpdate={fetchTodayAttendance}
          />
        )}
      </div>
    </div>
  );
}