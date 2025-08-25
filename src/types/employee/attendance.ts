// attendance.ts

import { IApiResponse, ISessionUser } from ".";
import { LeaveStatus, ILeave, ILeaveBalance } from "./leave";

export interface IAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeMobile: string;
  date: Date; // The date of the attendance record (based on check-in date)
  shiftId: string; // Reference to the shift
  shiftName: string; // Name of the shift (e.g., "Morning Shift")
  shiftStartTime: string; // Format: "HH:mm" (e.g., "08:00")
  shiftEndTime: string; // Format: "HH:mm" (e.g., "16:00")
  
  // Check-in/out details
  checkIn: Date;
  checkOut?: Date;
  checkInLocation?: IGeoLocation;
  checkOutLocation?: IGeoLocation;
  checkInReason?: string; // Reason for late check-in
  checkInStatus: CheckInStatus; // On-time, Late, etc.
  
  // Break details
  breaks: IBreak[];
  namazBreaks: INamazBreak[];
  
  // Work details
  totalHours: number; // Total hours worked (including breaks)
  actualWorkHours: number; // Actual hours worked (excluding breaks)
  overtimeHours: number;
  
  // Task details
  tasks: ITask[];
  
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShift {
  id: string;
  name: string;
  startTime: string; // Format: "HH:mm" (e.g., "08:00")
  endTime: string; // Format: "HH:mm" (e.g., "16:00")
  gracePeriod: number; // Minutes allowed after shift start before considered late (default: 15)
  isNightShift: boolean; // For shifts that span across midnight
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBreak {
  _id: any;
  id: string;
  attendanceId: string;
  breakType: BreakType;
  startTime: Date;
  endTime?: Date;
  duration?: number; // In minutes
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INamazBreak extends IBreak {
  _id: any;
  namazType: NamazType;
}

export interface ITask {
  id: string;
  attendanceId: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  timeSpent?: number; // In minutes (calculated if not provided)
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
  address?: string;
}

export interface IAttendanceSummary {
  employeeId: string;
  period: string; // e.g., "2025-08"
  totalWorkDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyDepartures: number;
  totalHoursWorked: number;
  averageHoursPerDay: number;
  overtimeHours: number;
  leaveDays: number;
}

export interface IAttendanceReport {
  employeeId: string;
  employeeName: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  records: IAttendance[];
  summary: IAttendanceSummary;
}

// Calendar and Shift Scheduling Types
export interface IShiftCalendar {
  id: string;
  name: string;
  description: string;
  year: number;
  isDefault: boolean;
  shifts: IShiftSchedule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IShiftSchedule {
  id: string;
  calendarId: string;
  shiftId: string;
  shift: IShift;
  dayOfWeek: DayOfWeek;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployeeShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  shift: IShift;
  calendarId: string;
  calendar: IShiftCalendar;
  startDate: Date;
  endDate?: Date;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDayOff {
  id: string;
  calendarId: string;
  date: Date;
  description: string;
  isRecurring: boolean;
  recurringType?: 'yearly' | 'monthly' | 'weekly';
  createdAt: Date;
  updatedAt: Date;
}

// Calendar View Types
export interface IAttendanceCalendarEvent {
  id: string;
  date: Date;
  type: 'attendance' | 'leave' | 'holiday' | 'dayoff';
  status: AttendanceStatus | LeaveStatus | 'holiday' | 'dayoff';
  title: string;
  description?: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  isAllDay: boolean;
  attendanceRecord?: IAttendance;
  leaveRecord?: ILeave;
  holiday?: IHoliday;
}

export interface IAttendanceCalendar {
  month: number;
  year: number;
  events: IAttendanceCalendarEvent[];
  summary: IAttendanceSummary;
}

export interface IHoliday {
  id: string;
  name: string;
  date: Date;
  description?: string;
  isRecurring: boolean;
  recurringType?: 'yearly' | 'monthly' | 'weekly';
  createdAt: Date;
  updatedAt: Date;
}

export interface ICalendarViewRequest {
  employeeId?: string;
  month: number;
  year: number;
  includeLeaves: boolean;
  includeHolidays: boolean;
}

// Enums and Type Definitions
export type AttendanceStatus = 
  | 'present' 
  | 'absent' 
  | 'half-day' 
  | 'on-leave' 
  | 'holiday' 
  | 'weekend';

export type CheckInStatus = 
  | 'on-time' 
  | 'late' 
  | 'early' 
  | 'no-check-in' 
  | 'no-check-out';

export type BreakType = 
  | 'general' 
  | 'lunch' 
  | 'tea' 
  | 'personal' 
  | 'other';

export type NamazType = 
  | 'fajr' 
  | 'dhuhr' 
  | 'asr' 
  | 'maghrib' 
  | 'isha';

export type TaskStatus = 
  | 'in-progress' 
  | 'completed' 
  | 'pending' 
  | 'cancelled';

export type DayOfWeek = 
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type ShiftType = 
  | 'morning' // 8am-4pm
  | 'evening' // 4pm-12am
  | 'night';   // 12am-8am

// Request/Response Interfaces
export interface ICheckInRequest {
  shiftId: string;
  location?: IGeoLocation;
  reason?: string; // Required if late
}

export interface ICheckOutRequest {
  location?: IGeoLocation;
  tasks: Omit<ITask, 'id' | 'attendanceId' | 'createdAt' | 'updatedAt'>[];
}

export interface IBreakStartRequest {
  breakType: BreakType;
  reason?: string;
  // For namaz breaks
  namazType?: NamazType;
}

export interface IBreakEndRequest {
  breakId: string;
}

export interface ITaskAddRequest {
  description: string;
  startTime: Date;
  endTime?: Date;
  timeSpent?: number; // In minutes
}

export interface IShiftCalendarRequest {
  name: string;
  description: string;
  year: number;
  shifts: IShiftScheduleRequest[];
}

export interface IShiftScheduleRequest {
  shiftId: string;
  dayOfWeek: DayOfWeek;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface IAttendanceApiResponse<T = unknown> extends IApiResponse<T> {
  data?: T;
}

// NextAuth module extensions for attendance
declare module "next-auth" {
  interface Session {
    user: ISessionUser;
    leaveBalance?: ILeaveBalance;
    todayAttendance?: IAttendance; // Today's attendance record if exists
    currentShift?: IShift; // Current shift assignment
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: 'employee';
    emailVerified: boolean;
    leaveBalance?: ILeaveBalance;
    defaultShiftId?: string;
    shiftCalendarId?: string;
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
    defaultShiftId?: string;
    shiftCalendarId?: string;
  }
}

// Utility types
export type AttendanceFilter = {
  employeeId?: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  status?: AttendanceStatus[];
  checkInStatus?: CheckInStatus[];
};

export type ShiftSchedule = {
  [day: string]: string[]; // day: ['shiftId1', 'shiftId2']
};

export type EmployeeShift = {
  employeeId: string;
  shiftId: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isDefault: boolean;
};

export type LateArrival = {
  date: Date;
  checkInTime: Date;
  scheduledTime: Date;
  lateBy: number; // minutes
  reason: string;
  status: 'excused' | 'unexcused';
};

export type OvertimeRecord = {
  date: Date;
  regularHours: number;
  overtimeHours: number;
  rate: number; // overtime rate multiplier
  totalOvertimePay: number;
};

// Default shifts definition
const DEFAULT_SHIFTS: IShift[] = [
  {
    id: 'morning',
    name: 'Morning Shift',
    startTime: '08:00',
    endTime: '16:00',
    gracePeriod: 15,
    isNightShift: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'evening',
    name: 'Evening Shift',
    startTime: '16:00',
    endTime: '00:00',
    gracePeriod: 15,
    isNightShift: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'night',
    name: 'Night Shift',
    startTime: '00:00',
    endTime: '08:00',
    gracePeriod: 15,
    isNightShift: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper function to find shift by ID
const findShiftById = (shiftId: string): IShift => {
  const shift = DEFAULT_SHIFTS.find(s => s.id === shiftId);
  if (!shift) {
    throw new Error(`Shift with ID ${shiftId} not found`);
  }
  return shift;
};

// Default calendar configuration for the described schedule
export const DEFAULT_CALENDAR_CONFIG: IShiftCalendar = {
  id: 'default',
  name: 'Default Shift Calendar',
  description: 'Standard shift calendar with Sunday off, Saturday all shifts, and night shift adjustments',
  year: 2025,
  isDefault: true,
  shifts: [
    // Monday - Friday: All shifts active
    { 
      id: '1', 
      calendarId: 'default', 
      shiftId: 'morning', 
      shift: findShiftById('morning'),
      dayOfWeek: 'monday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '2', 
      calendarId: 'default', 
      shiftId: 'evening', 
      shift: findShiftById('evening'),
      dayOfWeek: 'monday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '3', 
      calendarId: 'default', 
      shiftId: 'night', 
      shift: findShiftById('night'),
      dayOfWeek: 'monday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    
    { 
      id: '4', 
      calendarId: 'default', 
      shiftId: 'morning', 
      shift: findShiftById('morning'),
      dayOfWeek: 'tuesday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '5', 
      calendarId: 'default', 
      shiftId: 'evening', 
      shift: findShiftById('evening'),
      dayOfWeek: 'tuesday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '6', 
      calendarId: 'default', 
      shiftId: 'night', 
      shift: findShiftById('night'),
      dayOfWeek: 'tuesday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    
    { 
      id: '7', 
      calendarId: 'default', 
      shiftId: 'morning', 
      shift: findShiftById('morning'),
      dayOfWeek: 'wednesday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '8', 
      calendarId: 'default', 
      shiftId: 'evening', 
      shift: findShiftById('evening'),
      dayOfWeek: 'wednesday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '9', 
      calendarId: 'default', 
      shiftId: 'night', 
      shift: findShiftById('night'),
      dayOfWeek: 'wednesday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    
    { 
      id: '10', 
      calendarId: 'default', 
      shiftId: 'morning', 
      shift: findShiftById('morning'),
      dayOfWeek: 'thursday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '11', 
      calendarId: 'default', 
      shiftId: 'evening', 
      shift: findShiftById('evening'),
      dayOfWeek: 'thursday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '12', 
      calendarId: 'default', 
      shiftId: 'night', 
      shift: findShiftById('night'),
      dayOfWeek: 'thursday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    
    { 
      id: '13', 
      calendarId: 'default', 
      shiftId: 'morning', 
      shift: findShiftById('morning'),
      dayOfWeek: 'friday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '14', 
      calendarId: 'default', 
      shiftId: 'evening', 
      shift: findShiftById('evening'),
      dayOfWeek: 'friday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '15', 
      calendarId: 'default', 
      shiftId: 'night', 
      shift: findShiftById('night'),
      dayOfWeek: 'friday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    
    // Saturday: All shifts active
    { 
      id: '16', 
      calendarId: 'default', 
      shiftId: 'morning', 
      shift: findShiftById('morning'),
      dayOfWeek: 'saturday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '17', 
      calendarId: 'default', 
      shiftId: 'evening', 
      shift: findShiftById('evening'),
      dayOfWeek: 'saturday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '18', 
      calendarId: 'default', 
      shiftId: 'night', 
      shift: findShiftById('night'),
      dayOfWeek: 'saturday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    
    // Sunday: Only night shift active (which will be considered for Monday)
    { 
      id: '19', 
      calendarId: 'default', 
      shiftId: 'morning', 
      shift: findShiftById('morning'),
      dayOfWeek: 'sunday', 
      isActive: false, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '20', 
      calendarId: 'default', 
      shiftId: 'evening', 
      shift: findShiftById('evening'),
      dayOfWeek: 'sunday', 
      isActive: false, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
    { 
      id: '21', 
      calendarId: 'default', 
      shiftId: 'night', 
      shift: findShiftById('night'),
      dayOfWeek: 'sunday', 
      isActive: true, 
      effectiveFrom: new Date(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Color scheme for calendar visualization
export const CALENDAR_COLORS = {
  present: {
    backgroundColor: '#dcfce7', // Light green
    textColor: '#166534', // Dark green
    borderColor: '#bbf7d0', // Medium green
    symbol: 'P'
  },
  absent: {
    backgroundColor: '#fee2e2', // Light red
    textColor: '#991b1b', // Dark red
    borderColor: '#fecaca', // Medium red
    symbol: 'A'
  },
  'half-day': {
    backgroundColor: '#fef3c7', // Light yellow
    textColor: '#92400e', // Dark yellow
    borderColor: '#fde68a', // Medium yellow
    symbol: 'H'
  },
  'on-leave': {
    backgroundColor: '#fef3c7', // Light yellow
    textColor: '#92400e', // Dark yellow
    borderColor: '#fde68a', // Medium yellow
    symbol: 'L'
  },
  holiday: {
    backgroundColor: '#dbeafe', // Light blue
    textColor: '#1e40af', // Dark blue
    borderColor: '#bfdbfe', // Medium blue
    symbol: 'H'
  },
  weekend: {
    backgroundColor: '#e5e7eb', // Light gray
    textColor: '#374151', // Dark gray
    borderColor: '#d1d5db', // Medium gray
    symbol: 'W'
  },
  default: {
    backgroundColor: '#f3f4f6', // Light gray
    textColor: '#6b7280', // Medium gray
    borderColor: '#e5e7eb', // Light gray
    symbol: ''
  }
};

// Utility functions for handling the special shift scheduling
export const shiftUtils = {
  // Determine which day a night shift belongs to based on check-in time
  getNightShiftDate: (checkInTime: Date): Date => {
    const hour = checkInTime.getHours();
    // If checking in before 4 AM, consider it part of the previous day's night shift
    if (hour < 4) {
      const previousDay = new Date(checkInTime);
      previousDay.setDate(previousDay.getDate() - 1);
      return previousDay;
    }
    return checkInTime;
  },
  
  // Check if a check-in is for a night shift
  isNightShiftCheckIn: (checkInTime: Date, shift: IShift): boolean => {
    return shift.isNightShift || checkInTime.getHours() >= 20 || checkInTime.getHours() < 4;
  },
  
  // Calculate the correct date for attendance record based on shift type
  getAttendanceDate: (checkInTime: Date, shift: IShift): Date => {
    if (shift.isNightShift) {
      return shiftUtils.getNightShiftDate(checkInTime);
    }
    return checkInTime;
  },
  
  // Get the actual day of week for a shift considering night shifts
  getEffectiveDayOfWeek: (date: Date, shift: IShift): DayOfWeek => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let dayIndex = date.getDay();
    
    // For night shifts ending after midnight, adjust day of week
    if (shift.isNightShift && date.getHours() < 4) {
      dayIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Previous day
    }
    
    return days[dayIndex] as DayOfWeek;
  }
};

// Utility functions for calendar visualization
export const calendarUtils = {
  // Generate calendar events from attendance records
  generateCalendarEvents: (
    attendanceRecords: IAttendance[], 
    leaves: ILeave[] = [], 
    holidays: IHoliday[] = []
  ): IAttendanceCalendarEvent[] => {
    const events: IAttendanceCalendarEvent[] = [];
    
    // Process attendance records
    attendanceRecords.forEach(record => {
      const status = record.status;
      const colors = CALENDAR_COLORS[status] || CALENDAR_COLORS.default;
      
      events.push({
        id: `attendance-${record.id}`,
        date: new Date(record.date),
        type: 'attendance',
        status: status,
        title: `${colors.symbol} - ${record.shiftName}`,
        description: `Check-in: ${record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A'}, Check-out: ${record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'N/A'}`,
        backgroundColor: colors.backgroundColor,
        textColor: colors.textColor,
        borderColor: colors.borderColor,
        isAllDay: true,
        attendanceRecord: record
      });
    });
    
    // Process leave records
    leaves.forEach(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      
      // Create events for each day of leave
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const date = new Date(d);
        const colors = CALENDAR_COLORS['on-leave'];
        
        events.push({
          id: `leave-${leave.id}-${date.toISOString().split('T')[0]}`,
          date: date,
          type: 'leave',
          status: 'on-leave',
          title: `${colors.symbol} - ${leave.leaveType} Leave`,
          description: `Reason: ${leave.reason}, Status: ${leave.status}`,
          backgroundColor: colors.backgroundColor,
          textColor: colors.textColor,
          borderColor: colors.borderColor,
          isAllDay: true,
          leaveRecord: leave
        });
      }
    });
    
    // Process holidays
    holidays.forEach(holiday => {
      const colors = CALENDAR_COLORS.holiday;
      
      events.push({
        id: `holiday-${holiday.id}`,
        date: new Date(holiday.date),
        type: 'holiday',
        status: 'holiday',
        title: `${colors.symbol} - ${holiday.name}`,
        description: holiday.description,
        backgroundColor: colors.backgroundColor,
        textColor: colors.textColor,
        borderColor: colors.borderColor,
        isAllDay: true,
        holiday: holiday
      });
    });
    
    return events;
  },
  
  // Get color scheme for a specific status
  getStatusColor: (
    status: keyof typeof CALENDAR_COLORS
  ) => {
    return CALENDAR_COLORS[status] || CALENDAR_COLORS.default;
  }
};