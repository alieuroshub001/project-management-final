// types/employee-attendance.ts - Employee-focused attendance management types

export type AttendanceStatus = 
  | 'present' 
  | 'absent' 
  | 'late' 
  | 'half-day' 
  | 'on-leave' 
  | 'remote' 
  | 'early-departure';

export type ShiftType = 
  | 'morning'   // 8:00 AM - 4:00 PM
  | 'evening'   // 4:00 PM - 12:00 AM
  | 'night';    // 12:00 AM - 8:00 AM

export type BreakType = 
  | 'break' 
  | 'meal' 
  | 'tea' 
  | 'personal' 
  | 'other';

export type NamazType = 
  | 'fajr' 
  | 'dhuhr' 
  | 'asr' 
  | 'maghrib' 
  | 'isha'
  | 'jumma';

export type TaskCategory = 
  | 'development' 
  | 'design' 
  | 'testing' 
  | 'meeting' 
  | 'documentation' 
  | 'research' 
  | 'support'
  | 'training'
  | 'other';

export type TaskPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

export type TaskStatus = 
  | 'completed' 
  | 'in-progress'
  | 'paused';

// Predefined Shift Configurations
export const SHIFT_CONFIGS = {
  morning: {
    name: 'Morning Shift',
    type: 'morning' as ShiftType,
    startTime: '08:00',
    endTime: '16:00',
    requiredHours: 8,
    allowedBreakTime: 60, // 1 hour
    allowedNamazTime: 90, // 1.5 hours
    lateThresholdMinutes: 15, // Can check in up to 15 minutes late
    earlyCheckoutThresholdMinutes: 10 // Need reason if checking out 10+ minutes early
  },
  evening: {
    name: 'Evening Shift',
    type: 'evening' as ShiftType,
    startTime: '16:00',
    endTime: '00:00',
    requiredHours: 8,
    allowedBreakTime: 60, // 1 hour
    allowedNamazTime: 90, // 1.5 hours
    lateThresholdMinutes: 15,
    earlyCheckoutThresholdMinutes: 10
  },
  night: {
    name: 'Night Shift',
    type: 'night' as ShiftType,
    startTime: '00:00',
    endTime: '08:00',
    requiredHours: 8,
    allowedBreakTime: 60, // 1 hour
    allowedNamazTime: 90, // 1.5 hours
    lateThresholdMinutes: 15,
    earlyCheckoutThresholdMinutes: 10
  }
} as const;

// Basic Shift Information
export interface IShiftInfo {
  name: string;
  type: ShiftType;
  startTime: string; // HH:MM format (24-hour)
  endTime: string; // HH:MM format (24-hour)
  requiredHours: number; // Required working hours
  allowedBreakTime: number; // Total allowed break time in minutes
  allowedNamazTime: number; // Total allowed namaz time in minutes
  lateThresholdMinutes: number; // Maximum minutes late without reason
  earlyCheckoutThresholdMinutes: number; // Minutes before end time requiring reason
}

// Break Interface
export interface IBreak {
  id?: string;
  type: BreakType;
  start: Date;
  end?: Date;
  duration?: number; // in minutes
  notes?: string;
  createdAt: Date;
}

// Namaz Interface
export interface INamaz {
  id?: string;
  type: NamazType;
  start: Date;
  end?: Date;
  duration?: number; // in minutes
  notes?: string;
  createdAt: Date;
}

// Self-Added Task Interface
export interface ITaskCompleted {
  id?: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  hoursSpent: number;
  startTime?: Date;
  endTime?: Date;
  notes?: string;
  progressPercentage?: number; // 0-100 for in-progress tasks
  createdAt: Date;
  updatedAt: Date;
}

// Employee Attendance Summary
export interface IAttendanceSummary {
  totalWorkingTime: number; // in minutes
  totalBreakTime: number; // in minutes
  totalNamazTime: number; // in minutes
  totalTaskHours: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  productivityScore: number; // 0-100 based on task completion
  timeUtilization: number; // Percentage of time spent on tasks
}

// Main Employee Attendance Record
export interface IEmployeeAttendanceRecord {
  id?: string;
  employeeId: string;
  date: Date;
  shift: IShiftInfo;
  
  // Check-in/out data
  checkIn?: Date;
  checkOut?: Date;
  checkInReason?: string; // Required if more than 15 minutes late
  checkOutReason?: string; // Required if checking out 10+ minutes early
  
  // Status
  status: AttendanceStatus;
  isLate: boolean;
  isEarlyDeparture: boolean;
  isRemote: boolean;
  isHalfDay: boolean;
  
  // Employee Activities
  breaks: IBreak[];
  namaz: INamaz[];
  tasksCompleted: ITaskCompleted[];
  
  // Time calculations (auto-calculated)
  totalBreakMinutes: number;
  totalNamazMinutes: number;
  totalWorkingMinutes: number;
  actualWorkingMinutes: number; // Excluding breaks and namaz
  lateMinutes: number;
  earlyDepartureMinutes: number;
  
  // Summary
  summary: IAttendanceSummary;
  dailyNotes?: string; // Employee's daily notes
  
  // Status flags (read-only for employee)
  isApproved: boolean;
  rejectionReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Calendar View Types for Employee
export type CalendarViewType = 'month' | 'week' | 'day';

export interface IEmployeeCalendarDay {
  date: Date;
  attendance?: IEmployeeAttendanceRecord;
  isWorkingDay: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  shift?: IShiftInfo;
  hasLeave?: boolean;
  leaveType?: string;
  status: AttendanceStatus | 'no-record';
}

export interface IEmployeeCalendarWeek {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: IEmployeeCalendarDay[];
  weeklyStats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    totalHours: number;
    averageHours: number;
    totalTasks: number;
  };
}

export interface IEmployeeCalendarMonth {
  month: number;
  year: number;
  monthName: string;
  weeks: IEmployeeCalendarWeek[];
  monthlyStats: {
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    totalHours: number;
    averageHours: number;
    attendancePercentage: number;
    punctualityPercentage: number;
    totalTasks: number;
    completedTasks: number;
    productivityScore: number;
  };
}

// Employee Dashboard Stats
export interface IEmployeeAttendanceStats {
  today: {
    status: AttendanceStatus | 'not-checked-in';
    checkIn?: Date;
    currentWorkingTime: number; // in minutes
    totalBreaks: number;
    totalNamaz: number;
    tasksCompleted: number;
    isOnBreak: boolean;
    currentBreakType?: BreakType | NamazType;
  };
  thisWeek: {
    totalDays: number;
    presentDays: number;
    totalHours: number;
    averageHours: number;
    totalTasks: number;
    punctualityRate: number;
  };
  thisMonth: {
    totalWorkingDays: number;
    presentDays: number;
    totalHours: number;
    attendanceRate: number;
    totalTasks: number;
    productivityScore: number;
  };
}

// Current Session Interface (for active tracking)
export interface ICurrentSession {
  recordId: string;
  checkIn: Date;
  currentStatus: 'working' | 'on-break' | 'namaz';
  currentBreak?: {
    type: BreakType | NamazType;
    start: Date;
  };
  elapsedWorkingTime: number; // in minutes
  elapsedBreakTime: number; // in minutes
  elapsedNamazTime: number; // in minutes
  todaysTasks: ITaskCompleted[];
  canCheckOut: boolean;
  warnings: string[]; // e.g., "Break time exceeding limit"
}

// Forms and Input Types
export interface ICheckInForm {
  reason?: string; // Required if checking in more than 15 minutes late
  isRemote: boolean;
  notes?: string;
}

export interface ICheckOutForm {
  reason?: string; // Required if checking out 10+ minutes before shift end
  dailySummary?: string;
  completedTasks?: number;
}

export interface IBreakForm {
  type: BreakType;
  notes?: string;
}

export interface INamazForm {
  type: NamazType;
  notes?: string;
}

export interface ITaskForm {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  hoursSpent: number;
  startTime?: Date;
  endTime?: Date;
  notes?: string;
  status?: TaskStatus;
}

// Filter Options for Employee View
export interface IEmployeeAttendanceFilters {
  dateFrom?: Date;
  dateTo?: Date;
  status?: AttendanceStatus[];
  isApproved?: boolean;
}

// Employee Notifications
export interface IEmployeeNotification {
  id?: string;
  type: 'reminder' | 'approval' | 'rejection' | 'warning';
  title: string;
  message: string;
  isRead: boolean;
  actionRequired?: boolean;
  relatedRecordId?: string;
  createdAt: Date;
}

// Quick Actions for Employee
export interface IQuickActions {
  canCheckIn: boolean;
  canCheckOut: boolean;
  canStartBreak: boolean;
  canEndBreak: boolean;
  canStartNamaz: boolean;
  canEndNamaz: boolean;
  isOnBreak: boolean;
  isInNamaz: boolean;
  breakTimeRemaining?: number; // in minutes
  namazTimeRemaining?: number; // in minutes
  isLateCheckIn?: boolean;
  requiresCheckInReason?: boolean;
  requiresCheckOutReason?: boolean;
}

// Employee Settings (limited configuration)
export interface IEmployeeAttendancePreferences {
  id?: string;
  employeeId: string;
  
  // Notification preferences
  enableReminders: boolean;
  checkInReminder: boolean;
  checkOutReminder: boolean;
  breakReminder: boolean;
  
  // Display preferences
  defaultCalendarView: CalendarViewType;
  showProductivityScore: boolean;
  showTaskTimer: boolean;
  
  // Time preferences
  timeFormat: '12h' | '24h';
  timezone: string;
  
  updatedAt: Date;
}

// API Response Types
export interface IEmployeeAttendanceResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Real-time Status Update
export interface IEmployeeStatusUpdate {
  type: 'check-in' | 'check-out' | 'break-start' | 'break-end' | 'namaz-start' | 'namaz-end' | 'task-added';
  timestamp: Date;
  data: {
    currentStatus: 'working' | 'on-break' | 'namaz' | 'checked-out';
    workingTime: number;
    breakTime: number;
    namazTime: number;
    tasksCount: number;
  };
}

// Time Tracking Utilities
export interface ITimeCalculations {
  totalMinutes: number;
  hours: number;
  minutes: number;
  formatted: string; // "8h 30m"
}

// Task Statistics
export interface ITaskStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalHours: number;
  averageHoursPerTask: number;
  categoryBreakdown: Array<{
    category: TaskCategory;
    count: number;
    hours: number;
  }>;
  priorityBreakdown: Array<{
    priority: TaskPriority;
    count: number;
    hours: number;
  }>;
}

// Weekly/Monthly Reports for Employee
export interface IEmployeeAttendanceReport {
  period: 'week' | 'month';
  startDate: Date;
  endDate: Date;
  totalWorkingDays: number;
  presentDays: number;
  totalHours: number;
  averageDailyHours: number;
  punctualityRate: number;
  attendanceRate: number;
  totalTasks: number;
  productivityScore: number;
  topCategories: Array<{
    category: TaskCategory;
    hours: number;
    percentage: number;
  }>;
  dailyBreakdown: Array<{
    date: Date;
    status: AttendanceStatus;
    hours: number;
    tasks: number;
  }>;
}

// Utility functions for shift management
export interface IShiftValidation {
  isLateCheckIn: boolean;
  lateMinutes: number;
  requiresReason: boolean;
  isEarlyCheckOut: boolean;
  earlyMinutes: number;
  canCheckIn: boolean;
  canCheckOut: boolean;
  message: string;
}

