// models/employee/Attendance.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

// Attendance Document Interface
export interface IAttendanceDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  employeeEmail: string;
  employeeMobile: string;
  date: Date;
  shift: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  totalWorkingHours: number;
  status: string;
  isLateCheckIn: boolean;
  lateCheckInReason?: string;
  isEarlyCheckOut: boolean;
  earlyCheckOutReason?: string;
  breaks: Array<{
    id: string;
    breakType: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    reason?: string;
    isActive: boolean;
    createdAt: Date;
  }>;
  namazBreaks: Array<{
    id: string;
    namazType: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    isActive: boolean;
    createdAt: Date;
  }>;
  tasksPerformed: Array<{
    id: string;
    taskDescription: string;
    timeSpent: number;
    taskCategory?: string;
    priority?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  overtime?: {
    overtimeHours: number;
    reason: string;
    approvedBy?: string;
    approvedByName?: string;
    approvedAt?: Date;
    status: string;
    createdAt: Date;
  };
  location?: {
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
  };
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateWorkingHours(): number;
  calculateBreakTime(): number;
  calculateNamazBreakTime(): number;
  isCurrentlyOnBreak(): boolean;
  canCheckOut(): boolean;
  addBreak(breakData: any): void;
  endBreak(breakId: string): void;
  addNamazBreak(namazData: any): void;
  endNamazBreak(namazBreakId: string): void;
}

// Static methods interface
interface IAttendanceModel extends Model<IAttendanceDocument> {
  findByEmployee(employeeId: string, startDate?: Date, endDate?: Date): Promise<IAttendanceDocument[]>;
  findTodaysAttendance(employeeId: string): Promise<IAttendanceDocument | null>;
  findActiveBreaks(employeeId: string): Promise<IAttendanceDocument | null>;
  getMonthlyStats(employeeId: string, month: number, year: number): Promise<any>;
  getWeeklyStats(employeeId: string): Promise<any>;
}

const AttendanceSchema: Schema<IAttendanceDocument> = new Schema({
  employeeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  employeeName: { 
    type: String, 
    required: true 
  },
  employeeEmail: { 
    type: String, 
    required: true 
  },
  employeeMobile: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true,
    // Remove time component for date grouping
    set: function(value: Date) {
      const date = new Date(value);
      date.setHours(0, 0, 0, 0);
      return date;
    }
  },
  shift: { 
    type: String, 
    enum: ['morning', 'evening', 'night', 'random'],
    required: true 
  },
  checkInTime: { 
    type: Date 
  },
  checkOutTime: { 
    type: Date 
  },
  totalWorkingHours: { 
    type: Number, 
    default: 0,
    min: 0
  },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'partial', 'on-leave', 'holiday'],
    default: 'absent'
  },
  isLateCheckIn: { 
    type: Boolean, 
    default: false 
  },
  lateCheckInReason: { 
    type: String,
    maxlength: 500
  },
  isEarlyCheckOut: { 
    type: Boolean, 
    default: false 
  },
  earlyCheckOutReason: { 
    type: String,
    maxlength: 500
  },
  breaks: [{
    id: { type: String, required: true },
    breakType: { 
      type: String, 
      enum: ['lunch', 'tea', 'general', 'meeting', 'personal', 'emergency'],
      required: true 
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number, default: 0, min: 0 },
    reason: { type: String, maxlength: 255 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  namazBreaks: [{
    id: { type: String, required: true },
    namazType: { 
      type: String, 
      enum: ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'],
      required: true 
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  tasksPerformed: [{
    id: { type: String, required: true },
    taskDescription: { type: String, required: true, maxlength: 1000 },
    timeSpent: { type: Number, required: true, min: 0 },
    taskCategory: { 
      type: String, 
      enum: [
        'development', 'design', 'testing', 'documentation', 'meeting',
        'review', 'research', 'planning', 'support', 'other'
      ],
      default: 'other'
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    notes: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  overtime: {
    overtimeHours: { type: Number, min: 0 },
    reason: { type: String, maxlength: 500 },
    approvedBy: { type: String },
    approvedByName: { type: String },
    approvedAt: { type: Date },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    createdAt: { type: Date, default: Date.now }
  },
  location: {
    checkInLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String, maxlength: 500 }
    },
    checkOutLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String, maxlength: 500 }
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for better performance
AttendanceSchema.index({ employeeId: 1, date: -1 });
AttendanceSchema.index({ employeeId: 1, checkInTime: 1 });
AttendanceSchema.index({ date: 1, status: 1 });
AttendanceSchema.index({ shift: 1 });
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true }); // One record per employee per day

// Pre-save middleware
AttendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate total working hours if both check-in and check-out exist
  if (this.checkInTime && this.checkOutTime) {
    this.totalWorkingHours = this.calculateWorkingHours();
    this.status = 'present';
  } else if (this.checkInTime && !this.checkOutTime) {
    this.status = 'partial';
    // For partial status, calculate current working hours
    const now = new Date();
    const grossMinutes = Math.round((now.getTime() - this.checkInTime.getTime()) / (1000 * 60));
    const breakTime = this.calculateBreakTime();
    const namazBreakTime = this.calculateNamazBreakTime();
    
    // Calculate ongoing break time
    const ongoingBreakTime = this.breaks.filter(b => b.isActive).reduce((total, b) => {
      return total + Math.round((now.getTime() - b.startTime.getTime()) / (1000 * 60));
    }, 0);
    
    const ongoingNamazTime = this.namazBreaks.filter(nb => nb.isActive).reduce((total, nb) => {
      return total + Math.round((now.getTime() - nb.startTime.getTime()) / (1000 * 60));
    }, 0);
    
    this.totalWorkingHours = Math.max(0, grossMinutes - breakTime - namazBreakTime - ongoingBreakTime - ongoingNamazTime);
  }
  
  // Update break durations
  this.breaks.forEach(breakItem => {
    if (breakItem.endTime && breakItem.startTime) {
      breakItem.duration = Math.round((breakItem.endTime.getTime() - breakItem.startTime.getTime()) / (1000 * 60));
      breakItem.isActive = false;
    }
  });
  
  // Update namaz break durations
  this.namazBreaks.forEach(namazBreak => {
    if (namazBreak.endTime && namazBreak.startTime) {
      namazBreak.duration = Math.round((namazBreak.endTime.getTime() - namazBreak.startTime.getTime()) / (1000 * 60));
      namazBreak.isActive = false;
    }
  });
  
  next();
});

// Static methods
AttendanceSchema.statics.findByEmployee = function(
  employeeId: string, 
  startDate?: Date, 
  endDate?: Date
) {
  const query: any = { employeeId };
  
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    query.date = { $gte: startDate };
  } else if (endDate) {
    query.date = { $lte: endDate };
  }
  
  return this.find(query).sort({ date: -1 });
};

AttendanceSchema.statics.findTodaysAttendance = function(employeeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.findOne({ employeeId, date: today });
};

AttendanceSchema.statics.findActiveBreaks = function(employeeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.findOne({ 
    employeeId, 
    date: today,
    $or: [
      { 'breaks.isActive': true },
      { 'namazBreaks.isActive': true }
    ]
  });
};

AttendanceSchema.statics.getMonthlyStats = async function(
  employeeId: string, 
  month: number, 
  year: number
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const records = await this.find({
    employeeId,
    date: { $gte: startDate, $lte: endDate }
  });
  
  // Calculate working days in the month (excluding weekends)
  const totalWorkingDays = Array.from({ length: endDate.getDate() }, (_, i) => {
    const date = new Date(year, month - 1, i + 1);
    return date.getDay() !== 0 && date.getDay() !== 6; // Exclude Sunday (0) and Saturday (6)
  }).filter(Boolean).length;
  
  const presentDays = records.filter((r: { status: string; }) => r.status === 'present' || r.status === 'partial').length;
  const totalWorkingHours = records.reduce((sum: any, r: { totalWorkingHours: any; }) => sum + (r.totalWorkingHours || 0), 0);
  const attendancePercentage = totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 0;
  
  return {
    totalWorkingDays,
    presentDays,
    totalWorkingHours,
    attendancePercentage,
    records
  };
};

AttendanceSchema.statics.getWeeklyStats = async function(employeeId: string) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start from Sunday
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(today);
  weekEnd.setHours(23, 59, 59, 999);
  
  const records = await this.find({
    employeeId,
    date: { $gte: weekStart, $lte: weekEnd }
  });
  
  // Calculate working days in the week (exclude weekends)
  const totalWorkingDays = 5; // Monday to Friday
  const presentDays = records.filter((r: { status: string; }) => r.status === 'present' || r.status === 'partial').length;
  const totalWorkingHours = records.reduce((sum: any, r: { totalWorkingHours: any; }) => sum + (r.totalWorkingHours || 0), 0);
  const averageWorkingHours = presentDays > 0 ? totalWorkingHours / presentDays : 0;
  const lateCheckIns = records.filter((r: { isLateCheckIn: any; }) => r.isLateCheckIn).length;
  
  return {
    totalWorkingDays,
    presentDays,
    totalWorkingHours,
    averageWorkingHours,
    lateCheckIns
  };
};

// Instance methods
AttendanceSchema.methods.calculateWorkingHours = function(): number {
  if (!this.checkInTime || !this.checkOutTime) {
    // If still working, calculate current hours
    if (this.checkInTime && !this.checkOutTime) {
      const now = new Date();
      const grossMinutes = Math.round((now.getTime() - this.checkInTime.getTime()) / (1000 * 60));
      const breakTime = this.calculateBreakTime();
      const namazBreakTime = this.calculateNamazBreakTime();
      
      // Calculate ongoing break time
      const ongoingBreakTime = this.breaks.filter((b: { isActive: any; startTime: { getTime: () => number; }; }) => b.isActive).reduce((total: number, b: { startTime: { getTime: () => number; }; }) => {
        return total + Math.round((now.getTime() - b.startTime.getTime()) / (1000 * 60));
      }, 0);
      
      const ongoingNamazTime = this.namazBreaks.filter((nb: { isActive: any; }) => nb.isActive).reduce((total: number, nb: { startTime: { getTime: () => number; }; }) => {
        return total + Math.round((now.getTime() - nb.startTime.getTime()) / (1000 * 60));
      }, 0);
      
      return Math.max(0, grossMinutes - breakTime - namazBreakTime - ongoingBreakTime - ongoingNamazTime);
    }
    return 0;
  }
  
  const workingMinutes = Math.round((this.checkOutTime.getTime() - this.checkInTime.getTime()) / (1000 * 60));
  const breakTime = this.calculateBreakTime();
  const namazBreakTime = this.calculateNamazBreakTime();
  
  return Math.max(0, workingMinutes - breakTime - namazBreakTime);
};

AttendanceSchema.methods.calculateBreakTime = function(): number {
  return this.breaks.reduce((total: number, breakItem: { endTime: { getTime: () => number; }; startTime: { getTime: () => number; }; duration: number; }) => {
    if (breakItem.endTime && breakItem.startTime) {
      const duration = Math.round((breakItem.endTime.getTime() - breakItem.startTime.getTime()) / (1000 * 60));
      return total + duration;
    }
    // Return stored duration if available (for completed breaks)
    return total + (breakItem.duration || 0);
  }, 0);
};

AttendanceSchema.methods.calculateNamazBreakTime = function(): number {
  return this.namazBreaks.reduce((total: number, namazBreak: { endTime: { getTime: () => number; }; startTime: { getTime: () => number; }; duration: number; }) => {
    if (namazBreak.endTime && namazBreak.startTime) {
      const duration = Math.round((namazBreak.endTime.getTime() - namazBreak.startTime.getTime()) / (1000 * 60));
      return total + duration;
    }
    // Return stored duration if available (for completed namaz breaks)
    return total + (namazBreak.duration || 0);
  }, 0);
};

AttendanceSchema.methods.isCurrentlyOnBreak = function(): boolean {
  return this.breaks.some((b: { isActive: any; }) => b.isActive) || this.namazBreaks.some((nb: { isActive: any; }) => nb.isActive);
};

AttendanceSchema.methods.canCheckOut = function(): boolean {
  return this.checkInTime !== undefined && this.checkOutTime === undefined && !this.isCurrentlyOnBreak();
};

AttendanceSchema.methods.addBreak = function(breakData: any): void {
  const breakId = new mongoose.Types.ObjectId().toString();
  this.breaks.push({
    id: breakId,
    breakType: breakData.breakType,
    startTime: new Date(),
    reason: breakData.reason,
    duration: 0,
    isActive: true,
    createdAt: new Date()
  });
};

AttendanceSchema.methods.endBreak = function(breakId: string): void {
  const breakItem = this.breaks.find((b: { id: string; isActive: any; }) => b.id === breakId && b.isActive);
  if (breakItem) {
    breakItem.endTime = new Date();
    breakItem.isActive = false;
    breakItem.duration = Math.round((breakItem.endTime.getTime() - breakItem.startTime.getTime()) / (1000 * 60));
  }
};

AttendanceSchema.methods.addNamazBreak = function(namazData: any): void {
  const namazBreakId = new mongoose.Types.ObjectId().toString();
  this.namazBreaks.push({
    id: namazBreakId,
    namazType: namazData.namazType,
    startTime: new Date(),
    duration: 0,
    isActive: true,
    createdAt: new Date()
  });
};

AttendanceSchema.methods.endNamazBreak = function(namazBreakId: string): void {
  const namazBreak = this.namazBreaks.find((nb: { id: string; isActive: any; }) => nb.id === namazBreakId && nb.isActive);
  if (namazBreak) {
    namazBreak.endTime = new Date();
    namazBreak.isActive = false;
    namazBreak.duration = Math.round((namazBreak.endTime.getTime() - namazBreak.startTime.getTime()) / (1000 * 60));
  }
};

const Attendance: IAttendanceModel = 
  (mongoose.models.Attendance as IAttendanceModel) || 
  mongoose.model<IAttendanceDocument, IAttendanceModel>('Attendance', AttendanceSchema);

export default Attendance;