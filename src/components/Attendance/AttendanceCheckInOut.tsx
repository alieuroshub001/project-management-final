// components/Employee/Attendance/AttendanceCheckInOut.tsx
"use client";
import { useState, useEffect } from 'react';
import { 
  ICheckInRequest, 
  ICheckOutRequest, 
  ITodaysAttendance,
  ShiftType,
  BreakType,
  NamazType
} from '@/types/attendance';
import {
  Clock,
  MapPin,
  Sun,
  Moon,
  Sunset,
  Shuffle,
  Coffee,
  Heart,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  Edit3
} from 'lucide-react';

interface AttendanceCheckInOutProps {
  onSuccess?: () => void;
}

export default function AttendanceCheckInOut({ onSuccess }: AttendanceCheckInOutProps) {
  const [todaysAttendance, setTodaysAttendance] = useState<ITodaysAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Check-in form state
  const [selectedShift, setSelectedShift] = useState<ShiftType>('morning');
  const [customTimes, setCustomTimes] = useState({
    startTime: '',
    endTime: ''
  });
  const [lateReason, setLateReason] = useState('');
  const [earlyReason, setEarlyReason] = useState('');
  
  // Check-out form state
  const [tasksPerformed, setTasksPerformed] = useState([
    { taskDescription: '', timeSpent: 0, taskCategory: 'development' as const, priority: 'medium' as const, notes: '' }
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());

  const shiftOptions = [
    { value: 'morning' as ShiftType, label: 'Morning Shift', time: '8:00 AM - 4:00 PM', icon: Sun, color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' },
    { value: 'evening' as ShiftType, label: 'Evening Shift', time: '4:00 PM - 12:00 AM', icon: Sunset, color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' },
    { value: 'night' as ShiftType, label: 'Night Shift', time: '12:00 AM - 8:00 AM', icon: Moon, color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
    { value: 'random' as ShiftType, label: 'Flexible Hours', time: 'Custom timing', icon: Shuffle, color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' }
  ];

  const fetchTodaysAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employee/attendance/checkin');
      const data = await response.json();

      if (response.ok) {
        setTodaysAttendance(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch today\'s attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaysAttendance();
    
    // Update current time every minute
    const interval = setInterval(() => {
        setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const requestData: ICheckInRequest & { lateCheckInReason?: string } = {
        shift: selectedShift,
        ...(selectedShift === 'random' && {
          customStartTime: new Date(`${new Date().toDateString()} ${customTimes.startTime}`),
          customEndTime: new Date(`${new Date().toDateString()} ${customTimes.endTime}`)
        }),
        ...(lateReason && { lateCheckInReason: lateReason })
      };

      const response = await fetch('/api/employee/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check in');
      }

      setSuccess('Checked in successfully!');
      fetchTodaysAttendance();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (tasksPerformed.some(task => !task.taskDescription.trim() || task.timeSpent <= 0)) {
      setError('Please provide all task descriptions and time spent');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const requestData: ICheckOutRequest = {
        tasksPerformed: tasksPerformed.map(task => ({
          taskDescription: task.taskDescription,
          timeSpent: task.timeSpent,
          taskCategory: task.taskCategory,
          priority: task.priority,
          notes: task.notes
        })),
        ...(earlyReason && { earlyCheckOutReason: earlyReason })
      };

      const response = await fetch('/api/employee/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check out');
      }

      setSuccess('Checked out successfully!');
      fetchTodaysAttendance();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check out');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakAction = async (action: 'start' | 'end', type: 'break' | 'namaz', breakType?: BreakType, namazType?: NamazType, breakId?: string) => {
    setActionLoading(true);
    setError('');

    try {
      const endpoint = type === 'break' ? '/api/employee/attendance/breaks' : '/api/employee/attendance/namaz';
      const method = action === 'start' ? 'POST' : 'PUT';
      
      const requestData = action === 'start' 
        ? (type === 'break' ? { breakType } : { namazType })
        : (type === 'break' ? { breakId } : { namazBreakId: breakId });

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} ${type}`);
      }

      setSuccess(`${type === 'break' ? 'Break' : 'Namaz break'} ${action === 'start' ? 'started' : 'ended'} successfully!`);
      fetchTodaysAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} ${type}`);
    } finally {
      setActionLoading(false);
    }
  };

  const addTask = () => {
    setTasksPerformed([
      ...tasksPerformed,
      { taskDescription: '', timeSpent: 0, taskCategory: 'development', priority: 'medium', notes: '' }
    ]);
  };

  const removeTask = (index: number) => {
    if (tasksPerformed.length > 1) {
      setTasksPerformed(tasksPerformed.filter((_, i) => i !== index));
    }
  };

  const updateTask = (index: number, field: string, value: any) => {
    setTasksPerformed(tasksPerformed.map((task, i) => 
      i === index ? { ...task, [field]: value } : task
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Current Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Current Status</h2>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-1" />
            {formatTime(currentTime)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
              todaysAttendance?.hasCheckedIn 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <CheckCircle className={`w-8 h-8 ${
                todaysAttendance?.hasCheckedIn 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-400'
              }`} />
            </div>
            <p className="font-medium text-gray-900 dark:text-white">Check In</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {todaysAttendance?.hasCheckedIn 
                ? formatTime(new Date(todaysAttendance.attendance!.checkInTime!))
                : 'Not checked in'
              }
            </p>
          </div>

          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
              todaysAttendance?.hasCheckedOut 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <Clock className={`w-8 h-8 ${
                todaysAttendance?.hasCheckedOut 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400'
              }`} />
            </div>
            <p className="font-medium text-gray-900 dark:text-white">Check Out</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {todaysAttendance?.hasCheckedOut 
                ? formatTime(new Date(todaysAttendance.attendance!.checkOutTime!))
                : 'Not checked out'
              }
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="font-medium text-gray-900 dark:text-white">Working Hours</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDuration(todaysAttendance?.totalWorkingHours || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </div>
        </div>
      )}

      {/* Check In Section */}
      {!todaysAttendance?.hasCheckedIn && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Check In</h2>
          
          {/* Shift Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Your Shift
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shiftOptions.map((shift) => {
                const IconComponent = shift.icon;
                return (
                  <label
                    key={shift.value}
                    className={`relative flex cursor-pointer rounded-xl border p-4 focus:outline-none transition-all duration-200 ${
                      selectedShift === shift.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shift"
                      value={shift.value}
                      checked={selectedShift === shift.value}
                      onChange={(e) => setSelectedShift(e.target.value as ShiftType)}
                      className="sr-only"
                    />
                    <div className="flex items-center w-full">
                      <div className={`p-2 rounded-lg ${shift.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{shift.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{shift.time}</div>
                      </div>
                    </div>
                    {selectedShift === shift.value && (
                      <div className="absolute -inset-px rounded-xl border-2 border-indigo-500 pointer-events-none" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Custom Time Inputs for Random Shift */}
          {selectedShift === 'random' && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Set Custom Hours</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={customTimes.startTime}
                    onChange={(e) => setCustomTimes(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">End Time</label>
                  <input
                    type="time"
                    value={customTimes.endTime}
                    onChange={(e) => setCustomTimes(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Late Reason Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Late Check-in Reason (if applicable)
            </label>
            <textarea
              value={lateReason}
              onChange={(e) => setLateReason(e.target.value)}
              placeholder="Please provide reason if you're checking in late..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
              rows={2}
            />
          </div>

          <button
            onClick={handleCheckIn}
            disabled={actionLoading || (selectedShift === 'random' && (!customTimes.startTime || !customTimes.endTime))}
            className={`w-full px-6 py-3 rounded-xl font-medium transition-colors ${
              actionLoading 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {actionLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Checking In...
              </div>
            ) : (
              'Check In'
            )}
          </button>
        </div>
      )}

      {/* Break Management */}
      {todaysAttendance?.hasCheckedIn && !todaysAttendance?.hasCheckedOut && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Break Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Breaks */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                <Coffee className="w-5 h-5 mr-2" />
                General Breaks
              </h3>
              
              {todaysAttendance.activeBreaks.length > 0 ? (
                <div className="space-y-2">
                  {todaysAttendance.activeBreaks.map((breakItem) => (
                    <div key={breakItem.id} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-300 capitalize">
                            {breakItem.breakType.replace('-', ' ')} Break
                          </p>
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            Started at {formatTime(new Date(breakItem.startTime))}
                          </p>
                        </div>
                        <button
                          onClick={() => handleBreakAction('end', 'break', undefined, undefined, breakItem.id)}
                          className="px-3 py-1 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          End Break
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {['lunch', 'tea', 'general', 'personal'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleBreakAction('start', 'break', type as BreakType)}
                      className="w-full text-left px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors capitalize"
                    >
                      Start {type} Break
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Namaz Breaks */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                <Heart  className="w-5 h-5 mr-2" />
                Namaz Breaks
              </h3>
              
              {todaysAttendance.activeNamazBreaks.length > 0 ? (
                <div className="space-y-2">
                  {todaysAttendance.activeNamazBreaks.map((namazBreak) => (
                    <div key={namazBreak.id} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-300 capitalize">
                            {namazBreak.namazType} Prayer
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Started at {formatTime(new Date(namazBreak.startTime))}
                          </p>
                        </div>
                        <button
                          onClick={() => handleBreakAction('end', 'namaz', undefined, undefined, namazBreak.id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          End Prayer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {['fajr', 'zuhr', 'asr', 'maghrib', 'isha'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleBreakAction('start', 'namaz', undefined, type as NamazType)}
                      className="w-full text-left px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors capitalize"
                    >
                      Start {type} Prayer
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Check Out Section */}
      {todaysAttendance?.hasCheckedIn && !todaysAttendance?.hasCheckedOut && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Check Out</h2>
          
          {/* Tasks Performed */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Tasks Performed Today</h3>
              <button
                onClick={addTask}
                className="flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </button>
            </div>
            
            <div className="space-y-4">
              {tasksPerformed.map((task, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900 dark:text-white">Task {index + 1}</span>
                    {tasksPerformed.length > 1 && (
                      <button
                        onClick={() => removeTask(index)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Task Description</label>
                      <input
                        type="text"
                        value={task.taskDescription}
                        onChange={(e) => updateTask(index, 'taskDescription', e.target.value)}
                        placeholder="What did you work on?"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Time Spent (minutes)</label>
                      <input
                        type="number"
                        value={task.timeSpent}
                        onChange={(e) => updateTask(index, 'timeSpent', parseInt(e.target.value) || 0)}
                        placeholder="120"
                        min="0"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Category</label>
                      <select
                        value={task.taskCategory}
                        onChange={(e) => updateTask(index, 'taskCategory', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="development">Development</option>
                        <option value="design">Design</option>
                        <option value="testing">Testing</option>
                        <option value="documentation">Documentation</option>
                        <option value="meeting">Meeting</option>
                        <option value="review">Review</option>
                        <option value="research">Research</option>
                        <option value="planning">Planning</option>
                        <option value="support">Support</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Priority</label>
                      <select
                        value={task.priority}
                        onChange={(e) => updateTask(index, 'priority', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Notes (Optional)</label>
                    <textarea
                      value={task.notes}
                      onChange={(e) => updateTask(index, 'notes', e.target.value)}
                      placeholder="Additional details about this task..."
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Early Check-out Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Early Check-out Reason (if applicable)
            </label>
            <textarea
              value={earlyReason}
              onChange={(e) => setEarlyReason(e.target.value)}
              placeholder="Please provide reason if you're checking out early..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
              rows={2}
            />
          </div>

          <button
            onClick={handleCheckOut}
            disabled={actionLoading || todaysAttendance.activeBreaks.length > 0 || todaysAttendance.activeNamazBreaks.length > 0}
            className={`w-full px-6 py-3 rounded-xl font-medium transition-colors ${
              actionLoading || todaysAttendance.activeBreaks.length > 0 || todaysAttendance.activeNamazBreaks.length > 0
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {actionLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Checking Out...
              </div>
            ) : (
              'Check Out'
            )}
          </button>

          {(todaysAttendance.activeBreaks.length > 0 || todaysAttendance.activeNamazBreaks.length > 0) && (
            <p className="text-sm text-amber-600 dark:text-amber-400 text-center mt-2">
              Please end all active breaks before checking out
            </p>
          )}
        </div>
      )}

      {/* Already Checked Out */}
      {todaysAttendance?.hasCheckedOut && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-2">
            You've completed your workday!
          </h2>
          <p className="text-green-700 dark:text-green-400">
            Total working time: {formatDuration(todaysAttendance.totalWorkingHours)}
          </p>
          <p className="text-sm text-green-600 dark:text-green-500 mt-2">
            Thank you for your hard work today!
          </p>
        </div>
      )}
    </div>
  );
}