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
  Edit3,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';

interface AttendanceCheckInOutProps {
  onSuccess?: () => void;
}

// Safe default structure for todaysAttendance
const getDefaultTodaysAttendance = (): ITodaysAttendance => ({
  hasCheckedIn: false,
  hasCheckedOut: false,
  currentStatus: 'absent',
  attendance: undefined,
  activeBreaks: [],
  activeNamazBreaks: [],
  totalWorkingHours: 0,
  totalBreakTime: 0,
  remainingWorkingHours: 0
});

export default function AttendanceCheckInOut({ onSuccess }: AttendanceCheckInOutProps) {
  const [todaysAttendance, setTodaysAttendance] = useState<ITodaysAttendance>(getDefaultTodaysAttendance());
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
  const [showLateReasonInput, setShowLateReasonInput] = useState(false);
  const [showEarlyReasonInput, setShowEarlyReasonInput] = useState(false);
  const [isLateCheckIn, setIsLateCheckIn] = useState(false);
  const [isEarlyCheckOut, setIsEarlyCheckOut] = useState(false);
  
  // Check-out form state
  const [tasksPerformed, setTasksPerformed] = useState([
    { taskDescription: '', timeSpent: 0, taskCategory: 'development' as const, priority: 'medium' as const, notes: '' }
  ]);
  const [taskValidationErrors, setTaskValidationErrors] = useState<string[]>([]);
  const [totalTaskTime, setTotalTaskTime] = useState(0);
  const [expectedWorkingTime, setExpectedWorkingTime] = useState(0);

  const [currentTime, setCurrentTime] = useState(new Date());

  const shiftOptions = [
    { value: 'morning' as ShiftType, label: 'Morning Shift', time: '8:00 AM - 4:00 PM', icon: Sun, color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' },
    { value: 'evening' as ShiftType, label: 'Evening Shift', time: '4:00 PM - 12:00 AM', icon: Sunset, color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' },
    { value: 'night' as ShiftType, label: 'Night Shift', time: '12:00 AM - 8:00 AM', icon: Moon, color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
    { value: 'random' as ShiftType, label: 'Flexible Hours', time: 'Custom timing', icon: Shuffle, color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' }
  ];

  // Helper function to check if current time is late for shift
  const checkIfLateCheckIn = (shift: ShiftType, customStartTime?: string) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    let shiftStartMinutes = 0;
    
    switch (shift) {
      case 'morning':
        shiftStartMinutes = 8 * 60; // 8:00 AM
        break;
      case 'evening':
        shiftStartMinutes = 16 * 60; // 4:00 PM
        break;
      case 'night':
        shiftStartMinutes = 0; // 12:00 AM
        break;
      case 'random':
        if (customStartTime) {
          const [hours, minutes] = customStartTime.split(':').map(Number);
          shiftStartMinutes = hours * 60 + minutes;
        }
        break;
    }
    
    const graceMinutes = 15;
    return currentMinutes > (shiftStartMinutes + graceMinutes);
  };

  // Helper function to check if current time is early for checkout
  const checkIfEarlyCheckOut = () => {
    if (!todaysAttendance.attendance?.checkInTime) return false;
    
    const checkInTime = new Date(todaysAttendance.attendance.checkInTime);
    const now = new Date();
    const workingMinutes = (now.getTime() - checkInTime.getTime()) / (1000 * 60);
    const minWorkingMinutes = 8 * 60; // 8 hours
    
    return workingMinutes < (minWorkingMinutes - 15); // 15 minute grace period
  };

  // Calculate expected working time
  const calculateExpectedWorkingTime = () => {
    if (!todaysAttendance.attendance?.checkInTime) return 0;
    
    const checkInTime = new Date(todaysAttendance.attendance.checkInTime);
    const now = new Date();
    const grossMinutes = Math.round((now.getTime() - checkInTime.getTime()) / (1000 * 60));
    const breakTime = todaysAttendance.totalBreakTime || 0;
    
    return Math.max(0, grossMinutes - breakTime);
  };

  // Validate tasks
  const validateTasks = () => {
    const errors: string[] = [];
    let totalTime = 0;
    
    // Check if tasks are provided
    if (tasksPerformed.length === 0) {
      errors.push('At least one task is required');
      return errors;
    }
    
    // Validate each task
    tasksPerformed.forEach((task, index) => {
      if (!task.taskDescription.trim()) {
        errors.push(`Task ${index + 1}: Description is required`);
      }
      if (task.timeSpent <= 0) {
        errors.push(`Task ${index + 1}: Time spent must be greater than 0`);
      }
      totalTime += task.timeSpent;
    });
    
    // Check if total task time is reasonable
    const expectedTime = calculateExpectedWorkingTime();
    const timeDifference = Math.abs(totalTime - expectedTime);
    const allowedVariance = Math.max(60, expectedTime * 0.2); // 20% variance or 60 minutes minimum
    
    if (expectedTime > 0 && timeDifference > allowedVariance) {
      if (totalTime > expectedTime) {
        errors.push(`Total task time (${formatDuration(totalTime)}) exceeds working time (${formatDuration(expectedTime)}). Please adjust your tasks.`);
      } else {
        errors.push(`Total task time (${formatDuration(totalTime)}) is significantly less than working time (${formatDuration(expectedTime)}). Please account for all work done.`);
      }
    }
    
    if (totalTime < 30) {
      errors.push('Total task time should be at least 30 minutes');
    }
    
    return errors;
  };

  const fetchTodaysAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance/checkin');
      const data = await response.json();

      if (response.ok && data.success) {
        const attendanceData = data.data || {};
        
        // Create a properly structured todaysAttendance object with safe defaults
        const safeAttendanceData: ITodaysAttendance = {
          hasCheckedIn: attendanceData.hasCheckedIn || false,
          hasCheckedOut: attendanceData.hasCheckedOut || false,
          currentStatus: attendanceData.attendance?.status || 'absent',
          attendance: attendanceData.attendance || undefined,
          activeBreaks: [],
          activeNamazBreaks: [],
          totalWorkingHours: attendanceData.currentWorkingHours || 0,
          totalBreakTime: 0,
          remainingWorkingHours: Math.max(0, 480 - (attendanceData.currentWorkingHours || 0))
        };

        // Safely populate active breaks
        if (attendanceData.attendance?.breaks) {
          safeAttendanceData.activeBreaks = attendanceData.attendance.breaks.filter((b: any) => b.isActive) || [];
        }

        if (attendanceData.attendance?.namazBreaks) {
          safeAttendanceData.activeNamazBreaks = attendanceData.attendance.namazBreaks.filter((nb: any) => nb.isActive) || [];
        }

        // Calculate total break time for active breaks
        const breakTime = safeAttendanceData.activeBreaks.reduce((total, b) => {
          if (b.startTime) {
            const duration = Math.round((new Date().getTime() - new Date(b.startTime).getTime()) / (1000 * 60));
            return total + duration;
          }
          return total;
        }, 0);

        const namazBreakTime = safeAttendanceData.activeNamazBreaks.reduce((total, nb) => {
          if (nb.startTime) {
            const duration = Math.round((new Date().getTime() - new Date(nb.startTime).getTime()) / (1000 * 60));
            return total + duration;
          }
          return total;
        }, 0);

        // Add completed break times
        const completedBreakTime = attendanceData.attendance?.breaks?.reduce((total: number, b: any) => {
          return total + (b.duration || 0);
        }, 0) || 0;

        const completedNamazTime = attendanceData.attendance?.namazBreaks?.reduce((total: number, nb: any) => {
          return total + (nb.duration || 0);
        }, 0) || 0;

        safeAttendanceData.totalBreakTime = breakTime + namazBreakTime + completedBreakTime + completedNamazTime;

        // Update current working hours if checked in but not out
        if (safeAttendanceData.hasCheckedIn && !safeAttendanceData.hasCheckedOut && safeAttendanceData.attendance?.checkInTime) {
          const checkInTime = new Date(safeAttendanceData.attendance.checkInTime);
          const now = new Date();
          const grossMinutes = Math.round((now.getTime() - checkInTime.getTime()) / (1000 * 60));
          safeAttendanceData.totalWorkingHours = Math.max(0, grossMinutes - safeAttendanceData.totalBreakTime);
          safeAttendanceData.remainingWorkingHours = Math.max(0, 480 - safeAttendanceData.totalWorkingHours);
        }

        setTodaysAttendance(safeAttendanceData);
      } else {
        setTodaysAttendance(getDefaultTodaysAttendance());
      }
    } catch (err) {
      console.error('Failed to fetch today\'s attendance:', err);
      setTodaysAttendance(getDefaultTodaysAttendance());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaysAttendance();
    
    // Update current time every minute
    const interval = setInterval(() => {
        setCurrentTime(new Date());
        
        // Check if check-in would be late
        if (!todaysAttendance.hasCheckedIn) {
          const wouldBeLate = checkIfLateCheckIn(selectedShift, customTimes.startTime);
          setIsLateCheckIn(wouldBeLate);
          setShowLateReasonInput(wouldBeLate);
        }
        
        // Check if check-out would be early
        if (todaysAttendance.hasCheckedIn && !todaysAttendance.hasCheckedOut) {
          const wouldBeEarly = checkIfEarlyCheckOut();
          setIsEarlyCheckOut(wouldBeEarly);
          setShowEarlyReasonInput(wouldBeEarly);
          
          // Update expected working time
          const expectedTime = calculateExpectedWorkingTime();
          setExpectedWorkingTime(expectedTime);
        }
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedShift, customTimes.startTime, todaysAttendance.hasCheckedIn, todaysAttendance.hasCheckedOut]);

  // Update task calculations when tasks change
  useEffect(() => {
    const total = tasksPerformed.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
    setTotalTaskTime(total);
    
    // Clear task validation errors when tasks are updated
    if (taskValidationErrors.length > 0) {
      setTaskValidationErrors([]);
    }
  }, [tasksPerformed]);

  // Check late/early status when shift or time changes
  useEffect(() => {
    if (!todaysAttendance.hasCheckedIn) {
      const wouldBeLate = checkIfLateCheckIn(selectedShift, customTimes.startTime);
      setIsLateCheckIn(wouldBeLate);
      setShowLateReasonInput(wouldBeLate);
    }
  }, [selectedShift, customTimes.startTime, todaysAttendance.hasCheckedIn]);

  useEffect(() => {
    if (todaysAttendance.hasCheckedIn && !todaysAttendance.hasCheckedOut) {
      const wouldBeEarly = checkIfEarlyCheckOut();
      setIsEarlyCheckOut(wouldBeEarly);
      setShowEarlyReasonInput(wouldBeEarly);
      
      // Update expected working time
      const expectedTime = calculateExpectedWorkingTime();
      setExpectedWorkingTime(expectedTime);
    }
  }, [todaysAttendance.hasCheckedIn, todaysAttendance.hasCheckedOut, todaysAttendance.totalBreakTime]);

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
    // Validate late reason if needed
    if (isLateCheckIn && !lateReason.trim()) {
      setError('Please provide a reason for late check-in');
      return;
    }

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

      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check in');
      }

      setSuccess('Checked in successfully!');
      setLateReason('');
      fetchTodaysAttendance();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    // Clear previous errors
    setError('');
    setTaskValidationErrors([]);

    // Validate tasks
    const errors = validateTasks();
    if (errors.length > 0) {
      setTaskValidationErrors(errors);
      return;
    }

    // Validate early reason if needed
    if (isEarlyCheckOut && !earlyReason.trim()) {
      setError('Please provide a reason for early check-out');
      return;
    }

    setActionLoading(true);
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

      const response = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check out');
      }

      setSuccess('Checked out successfully!');
      setEarlyReason('');
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
      const endpoint = type === 'break' ? '/api/attendance/breaks' : '/api/attendance/namaz';
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

  // Safe access to arrays
  const activeBreaks = todaysAttendance?.activeBreaks || [];
  const activeNamazBreaks = todaysAttendance?.activeNamazBreaks || [];

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
              {todaysAttendance?.hasCheckedIn && todaysAttendance?.attendance?.checkInTime
                ? formatTime(new Date(todaysAttendance.attendance.checkInTime))
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
              {todaysAttendance?.hasCheckedOut && todaysAttendance?.attendance?.checkOutTime
                ? formatTime(new Date(todaysAttendance.attendance.checkOutTime))
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

      {/* Global Messages - Only show non-task validation errors */}
      {error && taskValidationErrors.length === 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
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

          {/* Late Check-in Warning and Reason */}
          {showLateReasonInput && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" />
                <h3 className="font-medium text-amber-800 dark:text-amber-300">Late Check-in Detected</h3>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                You're checking in after the scheduled start time. Please provide a reason.
              </p>
              <textarea
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
                placeholder="Please provide reason for late check-in..."
                className="w-full rounded-lg border border-amber-300 dark:border-amber-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-amber-500 focus:ring-amber-500"
                rows={2}
                required
              />
            </div>
          )}

          {/* Check-in Validation Errors */}
          {error && (!todaysAttendance?.hasCheckedIn) && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Custom Time Validation */}
          {selectedShift === 'random' && customTimes.startTime && customTimes.endTime && (
            (() => {
              const startTime = new Date(`1970-01-01T${customTimes.startTime}`);
              const endTime = new Date(`1970-01-01T${customTimes.endTime}`);
              const isInvalid = startTime >= endTime;
              
              return isInvalid ? (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                    <p className="text-red-700 dark:text-red-300">
                      End time must be after start time. Please adjust your custom hours.
                    </p>
                  </div>
                </div>
              ) : null;
            })()
          )}

          <button
            onClick={handleCheckIn}
            disabled={
              actionLoading || 
              (selectedShift === 'random' && (!customTimes.startTime || !customTimes.endTime)) || 
              (selectedShift === 'random' && customTimes.startTime && customTimes.endTime && 
                new Date(`1970-01-01T${customTimes.startTime}`) >= new Date(`1970-01-01T${customTimes.endTime}`)) ||
              (isLateCheckIn && !lateReason.trim())
            }
            className={`w-full px-6 py-3 rounded-xl font-medium transition-colors ${
              actionLoading || 
              (selectedShift === 'random' && (!customTimes.startTime || !customTimes.endTime)) || 
              (selectedShift === 'random' && customTimes.startTime && customTimes.endTime && 
                new Date(`1970-01-01T${customTimes.startTime}`) >= new Date(`1970-01-01T${customTimes.endTime}`)) ||
              (isLateCheckIn && !lateReason.trim())
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
              <div className="flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Check In
                {isLateCheckIn && <span className="ml-2 text-sm">(Late)</span>}
              </div>
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
              
              {activeBreaks.length > 0 ? (
                <div className="space-y-2">
                  {activeBreaks.map((breakItem) => (
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
                <Heart className="w-5 h-5 mr-2" />
                Namaz Breaks
              </h3>
              
              {activeNamazBreaks.length > 0 ? (
                <div className="space-y-2">
                  {activeNamazBreaks.map((namazBreak) => (
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
          
          {/* Time Summary */}
          {expectedWorkingTime > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Time Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Expected Working Time:</span>
                  <p className="font-medium text-blue-800 dark:text-blue-300">
                    {formatDuration(expectedWorkingTime)}
                  </p>
                </div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Total Task Time:</span>
                  <p className={`font-medium ${
                    Math.abs(totalTaskTime - expectedWorkingTime) > Math.max(60, expectedWorkingTime * 0.2)
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {formatDuration(totalTaskTime)}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                <Info className="w-3 h-3 inline mr-1" />
                Task time should approximately match your working time
              </div>
            </div>
          )}
          
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
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-300 p-1 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Task Description <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={task.taskDescription}
                        onChange={(e) => updateTask(index, 'taskDescription', e.target.value)}
                        placeholder="What did you work on?"
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Time Spent (minutes) <span className="text-red-500">*</span>
                      </label>
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

          {/* Early Check-out Warning and Reason */}
          {showEarlyReasonInput && (
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center mb-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
                <h3 className="font-medium text-orange-800 dark:text-orange-300">Early Check-out Detected</h3>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-400 mb-3">
                You're checking out before completing your full shift. Please provide a reason.
              </p>
              <textarea
                value={earlyReason}
                onChange={(e) => setEarlyReason(e.target.value)}
                placeholder="Please provide reason for early check-out..."
                className="w-full rounded-lg border border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-orange-500"
                rows={2}
                required
              />
            </div>
          )}

          {/* Check-out Validation Errors */}
          {error && (todaysAttendance?.hasCheckedIn && !todaysAttendance?.hasCheckedOut) && taskValidationErrors.length === 0 && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Task Validation Errors - Moved here to be more visible */}
          {taskValidationErrors.length > 0 && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-800 dark:text-red-300 mb-2">
                    Please fix the following issues before checking out:
                  </h3>
                  <ul className="space-y-1">
                    {taskValidationErrors.map((taskError, index) => (
                      <li key={index} className="text-sm text-red-700 dark:text-red-400 flex items-center">
                        <X className="w-3 h-3 mr-2 flex-shrink-0" />
                        {taskError}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Active Breaks Warning */}
          {(activeBreaks.length > 0 || activeNamazBreaks.length > 0) && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-2">
                    Active breaks must be ended before checkout
                  </h3>
                  <div className="text-sm text-amber-700 dark:text-amber-400">
                    {activeBreaks.length > 0 && (
                      <p className="mb-1">
                        Active general breaks: {activeBreaks.map(b => b.breakType).join(', ')}
                      </p>
                    )}
                    {activeNamazBreaks.length > 0 && (
                      <p>
                        Active prayer breaks: {activeNamazBreaks.map(nb => nb.namazType).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleCheckOut}
            disabled={actionLoading || activeBreaks.length > 0 || activeNamazBreaks.length > 0}
            className={`w-full px-6 py-3 rounded-xl font-medium transition-colors ${
              actionLoading || activeBreaks.length > 0 || activeNamazBreaks.length > 0
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
              <div className="flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Check Out
                {isEarlyCheckOut && <span className="ml-2 text-sm">(Early)</span>}
              </div>
            )}
          </button>
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