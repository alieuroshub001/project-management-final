// attendance.ts
import { IApiResponse, ISessionUser } from ".";
import { ILeaveBalance } from "./leave";

export interface IAttendance {
  _id: string;
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeMobile: string;
  date: Date;
  shift: ShiftType;
  scheduledStart: Date;
  scheduledEnd: Date;
  checkIns: ICheckIn[];
  checkOuts: ICheckOut[];
  breaks: IBreak[];
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  status: AttendanceStatus;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  tasks: ITask[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICheckIn {
  id: string;
  attendanceId: string;
  timestamp: Date;
  location?: IGeoLocation;
  isLate: boolean;
  lateMinutes: number;
  deviceInfo?: string;
  imageCapture?: string; // URL to check-in image
}

export interface ICheckOut {
  id: string;
  attendanceId: string;
  timestamp: Date;
  location?: IGeoLocation;
  isEarly: boolean;
  earlyMinutes: number;
  tasksCompleted: boolean;
  deviceInfo?: string;
  imageCapture?: string; // URL to check-out image
}

export interface IBreak {
  id: string;
  attendanceId: string;
  type: BreakType;
  start: Date;
  end?: Date;
  duration?: number; // in minutes
  isPaid: boolean;
}

export interface ITask {
  _id: Key | null | undefined;
  id: string;
  attendanceId: string;
  description: string;
  timeAllocated: number; // in minutes
  timeSpent: number; // in minutes
  completed: boolean;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface IAttendanceSummary {
  onBreakDays: any;
  weeklyBreakdown(weeklyBreakdown: any): unknown;
  totalBreakHours: any;
  employeeId: string;
  period: DateRange;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyDepartureDays: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  averageHoursPerDay: number;
  attendanceRate: number;
}

export interface IAttendanceCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  employeeName: string;
  status: AttendanceStatus;
  allDay: boolean;
  type: 'attendance';
}

export interface IShift {
  id: string;
  name: string;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  gracePeriod: number; // in minutes
  isActive: boolean;
  colorCode: string;
  description?: string;
}

export interface IEmployeeShift {
  id: string;
  employeeId: string;
  shiftId: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isDefault: boolean;
}

export interface IAttendancePolicy {
  id: string;
  policyName: string;
  description: string;
  gracePeriod: number; // in minutes
  maxLateAllowed: number; // per month
  deductionForLate: number; // amount or percentage
  overtimeEligibility: boolean;
  overtimeRate: number;
  breakRules: IBreakRule[];
  requiresTaskCompletion: boolean;
  locationTracking: boolean;
  imageCaptureRequired: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBreakRule {
  type: BreakType;
  duration: number; // in minutes
  paid: boolean;
  frequency: 'per-shift' | 'per-hours-worked';
  minHoursBeforeEligible: number;
  maxConsecutiveBreaks: number;
}

export interface IAttendanceReport {
  employeeId: string;
  employeeName: string;
  period: DateRange;
  totalShifts: number;
  completedShifts: number;
  lateArrivals: number;
  earlyDepartures: number;
  totalHoursWorked: number;
  totalOvertime: number;
  attendancePercentage: number;
  tasksCompleted: number;
  tasksPending: number;
}

export interface IAttendanceValidation {
  canCheckIn: boolean;
  canCheckOut: boolean;
  hasPendingTasks: boolean;
  isWithinShift: boolean;
  hasCheckedIn: boolean;
  message?: string;
}

// Types
export type ShiftType = 'morning' | 'evening' | 'night' | 'custom';

export type AttendanceStatus = 
  | 'present' 
  | 'absent' 
  | 'late' 
  | 'half-day' 
  | 'early-departure' 
  | 'on-break' 
  | 'holiday'
  | 'weekend'
  | 'leave';

export type BreakType = 
  | 'lunch' 
  | 'tea' 
  | 'rest' 
  | 'prayer' 
  | 'personal' 
  | 'emergency';

export type TaskPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'critical';

export type DateRange = {
  start: Date;
  end: Date;
};

// Request/Response Interfaces
export interface ICheckInRequest {
  timestamp?: Date;
  location?: IGeoLocation;
  deviceInfo?: string;
  image?: File;
}

export interface ICheckOutRequest {
  timestamp?: Date;
  location?: IGeoLocation;
  tasks: ITaskCompletion[];
  deviceInfo?: string;
  image?: File;
}

export interface ITaskCompletion {
  taskId: string;
  timeSpent: number;
  completed: boolean;
}

export interface IBreakRequest {
  type: BreakType;
  start?: Date;
}

export interface IBreakEndRequest {
  breakId: string;
  end?: Date;
}

export interface IAttendanceFilter {
  employeeId?: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  status?: AttendanceStatus[];
  shift?: ShiftType[];
}

export interface IAttendanceApiResponse<T = unknown> extends IApiResponse<T> {
  data?: T;
}

// NextAuth module extensions for attendance
declare module "next-auth" {
  interface Session {
    user: ISessionUser;
    leaveBalance?: ILeaveBalance;
    attendanceSummary?: IAttendanceSummary;
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: 'employee';
    emailVerified: boolean;
    leaveBalance?: ILeaveBalance;
    currentShift?: IShift;
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
    leaveBalance?: ILeaveBalance;
    currentShift?: IShift;
  }
}