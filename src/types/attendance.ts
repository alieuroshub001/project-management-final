import { IApiResponse, ISessionUser } from ".";

// Core Attendance Interface
export interface IAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeMobile: string;
  date: Date; // Date without time for grouping
  shift: ShiftType;
  checkInTime?: Date;
  checkOutTime?: Date;
  totalWorkingHours: number; // in minutes
  status: AttendanceStatus;
  isLateCheckIn: boolean;
  lateCheckInReason?: string;
  isEarlyCheckOut: boolean;
  earlyCheckOutReason?: string;
  breaks: IBreak[];
  namazBreaks: INamazBreak[];
  tasksPerformed: ITaskPerformed[];
  overtime?: IOvertimeRecord;
  location?: ILocationRecord;
  createdAt: Date;
  updatedAt: Date;
}

// Break Interface
export interface IBreak {
  id: string;
  attendanceId: string;
  breakType: BreakType;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  reason?: string;
  isActive: boolean; // true if break is ongoing
  createdAt: Date;
}

// Namaz Break Interface  
export interface INamazBreak {
  id: string;
  attendanceId: string;
  namazType: NamazType;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  isActive: boolean; // true if namaz break is ongoing
  createdAt: Date;
}

// Task Performed Interface
export interface ITaskPerformed {
  id: string;
  attendanceId: string;
  taskDescription: string;
  timeSpent: number; // in minutes
  taskCategory?: TaskCategory;
  priority?: TaskPriority;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Overtime Record Interface
export interface IOvertimeRecord {
  id: string;
  attendanceId: string;
  overtimeHours: number; // in minutes
  reason: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  status: OvertimeStatus;
  createdAt: Date;
}

// Location Record Interface (for location tracking if needed)
export interface ILocationRecord {
  checkInLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

// Attendance Summary Interface
export interface IAttendanceSummary {
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  totalWorkingDays: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalLateCheckIns: number;
  totalEarlyCheckOuts: number;
  totalWorkingHours: number; // in minutes
  totalBreakTime: number; // in minutes
  totalNamazBreakTime: number; // in minutes
  totalOvertimeHours: number; // in minutes
  averageWorkingHours: number; // in minutes
  attendancePercentage: number;
}

// Shift Configuration Interface
export interface IShiftConfig {
  id: string;
  shiftType: ShiftType;
  startTime: string; // "08:00"
  endTime: string; // "16:00"
  graceTime: number; // in minutes (15 minutes default)
  minWorkingHours: number; // in minutes
  maxWorkingHours: number; // in minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Policy Interface
export interface IAttendancePolicy {
  id: string;
  policyName: string;
  lateCheckInGraceTime: number; // in minutes
  earlyCheckOutGraceTime: number; // in minutes
  maxBreakTime: number; // in minutes per day
  maxNamazBreakTime: number; // in minutes per day
  requireLocationTracking: boolean;
  requireTaskEntry: boolean;
  overtimeAutoCalculation: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Report Interface
export interface IAttendanceReport {
  employeeId: string;
  employeeName: string;
  department?: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateCheckIns: number;
  earlyCheckOuts: number;
  totalWorkingHours: number;
  totalBreakTime: number;
  totalOvertimeHours: number;
  attendancePercentage: number;
  averageCheckInTime: string;
  averageCheckOutTime: string;
  attendanceRecords: IAttendance[];
}

// Enums and Types
export type ShiftType = 
  | 'morning'    // 8:00 AM - 4:00 PM
  | 'evening'    // 4:00 PM - 12:00 AM
  | 'night'      // 12:00 AM - 8:00 AM
  | 'random';    // Employee enters their own time

export type AttendanceStatus = 
  | 'present'
  | 'absent'
  | 'partial'    // Checked in but not checked out
  | 'on-leave'
  | 'holiday';

export type BreakType = 
  | 'lunch'
  | 'tea'
  | 'general'
  | 'meeting'
  | 'personal'
  | 'emergency';

export type NamazType = 
  | 'fajr'
  | 'zuhr'
  | 'asr'
  | 'maghrib'
  | 'isha';

export type TaskCategory = 
  | 'development'
  | 'design'
  | 'testing'
  | 'documentation'
  | 'meeting'
  | 'review'
  | 'research'
  | 'planning'
  | 'support'
  | 'other';

export type TaskPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type OvertimeStatus = 
  | 'pending'
  | 'approved'
  | 'rejected';

// Request Interfaces
export interface ICheckInRequest {
  shift: ShiftType;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  customStartTime?: Date; // For random shift
  customEndTime?: Date; // For random shift
}

export interface ICheckOutRequest {
  tasksPerformed: Omit<ITaskPerformed, 'id' | 'attendanceId' | 'createdAt' | 'updatedAt'>[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  earlyCheckOutReason?: string;
}

export interface IBreakStartRequest {
  breakType: BreakType;
  reason?: string;
}

export interface IBreakEndRequest {
  breakId: string;
}

export interface INamazBreakStartRequest {
  namazType: NamazType;
}

export interface INamazBreakEndRequest {
  namazBreakId: string;
}

export interface IAttendanceFilterRequest {
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
  shift?: ShiftType;
  status?: AttendanceStatus;
  isLateCheckIn?: boolean;
  isEarlyCheckOut?: boolean;
}

export interface IAttendanceUpdateRequest {
  checkInTime?: Date;
  checkOutTime?: Date;
  lateCheckInReason?: string;
  earlyCheckOutReason?: string;
  tasksPerformed?: Omit<ITaskPerformed, 'id' | 'attendanceId' | 'createdAt' | 'updatedAt'>[];
}

// Response Interfaces
export interface IAttendanceApiResponse<T = unknown> extends IApiResponse<T> {
  data?: T;
}

export interface IAttendanceWithDetails extends IAttendance {
  shiftConfig: IShiftConfig;
  totalBreakTime: number;
  totalNamazBreakTime: number;
  effectiveWorkingHours: number;
  isOvertimeEligible: boolean;
}

export interface ITodaysAttendance {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  currentStatus: AttendanceStatus;
  attendance?: IAttendance;
  activeBreaks: IBreak[];
  activeNamazBreaks: INamazBreak[];
  totalWorkingHours: number;
  totalBreakTime: number;
  remainingWorkingHours: number;
}

// Dashboard Interfaces
export interface IAttendanceDashboard {
  todaysAttendance: ITodaysAttendance;
  weeklyStats: {
    totalWorkingDays: number;
    presentDays: number;
    totalWorkingHours: number;
    averageWorkingHours: number;
    lateCheckIns: number;
  };
  monthlyStats: {
    totalWorkingDays: number;
    presentDays: number;
    totalWorkingHours: number;
    attendancePercentage: number;
    totalOvertimeHours: number;
  };
  recentAttendance: IAttendance[];
  upcomingShifts: Array<{
    date: Date;
    shift: ShiftType;
    startTime: string;
    endTime: string;
  }>;
}

// Utility Types
export type AttendanceCalendarEvent = {
  date: Date;
  status: AttendanceStatus;
  checkInTime?: Date;
  checkOutTime?: Date;
  shift: ShiftType;
  totalHours: number;
  isLate: boolean;
  isEarlyOut: boolean;
};

export type ShiftTiming = {
  shift: ShiftType;
  startTime: Date;
  endTime: Date;
  totalHours: number;
};

export type AttendanceValidation = {
  canCheckIn: boolean;
  canCheckOut: boolean;
  isLateCheckIn: boolean;
  isEarlyCheckOut: boolean;
  message?: string;
};

// NextAuth module declarations
declare module "next-auth" {
  interface Session {
    user: ISessionUser;
    todaysAttendance?: ITodaysAttendance;
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: 'employee';
    emailVerified: boolean;
    todaysAttendance?: ITodaysAttendance;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: 'employee';
    emailVerified: boolean;
    todaysAttendance?: ITodaysAttendance;
  }
}