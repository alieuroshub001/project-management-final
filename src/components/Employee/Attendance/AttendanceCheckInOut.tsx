// components/Employee/Attendance/AttendanceCheckInOut.tsx
"use client";
import { useState, useEffect } from 'react';
import { IAttendance, ICheckInRequest, ICheckOutRequest } from '@/types/employee/attendance';
import { format } from 'date-fns';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Coffee,
  MapPin,
  Camera,
  Loader2
} from 'lucide-react';

export default function AttendanceCheckInOut() {
  const [todayAttendance, setTodayAttendance] = useState<IAttendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentBreak, setCurrentBreak] = useState<any>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);

  useEffect(() => {
    fetchTodayAttendance();
    getCurrentLocation();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch('/api/employee/attendance/today');
      if (response.ok) {
        const data = await response.json();
        setTodayAttendance(data.data);
        
        // Check for active break
        const activeBreak = data.data.breaks?.find((b: any) => !b.end);
        setCurrentBreak(activeBreak);
      }
    } catch (error) {
      console.error('Failed to fetch today\'s attendance:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          // You could reverse geocode here to get address
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const checkInData: ICheckInRequest = {
        timestamp: new Date(),
        location,
        deviceInfo: navigator.userAgent
      };

      const response = await fetch('/api/employee/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkInData)
      });

      if (response.ok) {
        await fetchTodayAttendance();
      }
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const checkOutData: ICheckOutRequest = {
        timestamp: new Date(),
        location,
        deviceInfo: navigator.userAgent,
        tasks: todayAttendance?.tasks?.map(task => ({
          taskId: task.id,
          timeSpent: task.timeSpent,
          completed: task.completed
        })) || []
      };

      const response = await fetch('/api/employee/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkOutData)
      });

      if (response.ok) {
        await fetchTodayAttendance();
      }
    } catch (error) {
      console.error('Check-out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/employee/attendance/break/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'rest' })
      });

      if (response.ok) {
        await fetchTodayAttendance();
      }
    } catch (error) {
      console.error('Start break failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!currentBreak) return;

    setLoading(true);
    try {
      const response = await fetch('/api/employee/attendance/break/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breakId: currentBreak.id })
      });

      if (response.ok) {
        await fetchTodayAttendance();
      }
    } catch (error) {
      console.error('End break failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = todayAttendance?.checkIns?.length > 0;
  const isCheckedOut = todayAttendance?.checkOuts?.length > 0;
  const canCheckOut = isCheckedIn && !isCheckedOut;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Daily Attendance
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className={`text-center p-4 rounded-lg border-2 ${
            isCheckedIn 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20'
          }`}>
            <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${
              isCheckedIn ? 'text-green-600' : 'text-gray-400'
            }`} />
            <span className="text-sm font-medium">Checked In</span>
          </div>

          <div className={`text-center p-4 rounded-lg border-2 ${
            currentBreak 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20'
          }`}>
            <Coffee className={`w-8 h-8 mx-auto mb-2 ${
              currentBreak ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <span className="text-sm font-medium">On Break</span>
          </div>

          <div className={`text-center p-4 rounded-lg border-2 ${
            isCheckedOut 
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20'
          }`}>
            <XCircle className={`w-8 h-8 mx-auto mb-2 ${
              isCheckedOut ? 'text-red-600' : 'text-gray-400'
            }`} />
            <span className="text-sm font-medium">Checked Out</span>
          </div>
        </div>

        {/* Location Info */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {location ? 'Location detected' : 'Location not available'}
              </span>
            </div>
            <button 
              onClick={getCurrentLocation}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Check In Button */}
          <button
            onClick={handleCheckIn}
            disabled={isCheckedIn || loading}
            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 ${
              isCheckedIn
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 cursor-not-allowed'
                : 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:shadow-md'
            }`}
          >
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
            ) : (
              <CheckCircle className="w-8 h-8 mb-2" />
            )}
            <span className="font-semibold">Check In</span>
            {todayAttendance?.checkIns?.[0] && (
              <span className="text-xs mt-1">
                at {format(new Date(todayAttendance.checkIns[0].timestamp), 'hh:mm a')}
              </span>
            )}
          </button>

          {/* Break Button */}
          <button
            onClick={currentBreak ? handleEndBreak : handleStartBreak}
            disabled={!isCheckedIn || isCheckedOut || loading}
            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 ${
              currentBreak
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:shadow-md'
                : 'border-gray-500 bg-gray-50 dark:bg-gray-900/20 hover:bg-gray-100 dark:hover:bg-gray-900/30 text-gray-700 dark:text-gray-300 hover:shadow-md'
            } ${(!isCheckedIn || isCheckedOut) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
            ) : (
              <Coffee className="w-8 h-8 mb-2" />
            )}
            <span className="font-semibold">
              {currentBreak ? 'End Break' : 'Start Break'}
            </span>
            {currentBreak && (
              <span className="text-xs mt-1">
                Started {format(new Date(currentBreak.start), 'hh:mm a')}
              </span>
            )}
          </button>

          {/* Check Out Button */}
          <button
            onClick={handleCheckOut}
            disabled={!canCheckOut || loading}
            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 ${
              canCheckOut
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 hover:shadow-md'
                : 'border-gray-300 bg-gray-50 dark:bg-gray-900/20 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
            ) : (
              <XCircle className="w-8 h-8 mb-2" />
            )}
            <span className="font-semibold">Check Out</span>
            {todayAttendance?.checkOuts?.[0] && (
              <span className="text-xs mt-1">
                at {format(new Date(todayAttendance.checkOuts[0].timestamp), 'hh:mm a')}
              </span>
            )}
          </button>
        </div>

        {/* Today's Summary */}
        {todayAttendance && (
          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todayAttendance.totalHours || 0}h
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todayAttendance.breakHours || 0}h
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Break Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todayAttendance.overtimeHours || 0}h
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Overtime</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}