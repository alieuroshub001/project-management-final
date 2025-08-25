// models/employee/Attendance.ts
import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import { 
  IAttendance, 
  ICheckIn, 
  ICheckOut, 
  IBreak, 
  ITask,
  ShiftType,
  AttendanceStatus,
  BreakType,
  TaskPriority
} from '@/types/employee/attendance';

// Define the document interface that extends mongoose Document
export interface IAttendanceDocument extends Document {
  employeeId: Types.ObjectId;
  employeeName: string;
  employeeEmail: string;
  employeeMobile: string;
  date: Date;
  shift: ShiftType;
  scheduledStart: Date;
  scheduledEnd: Date;
  checkIns: Types.Array<ICheckIn>;
  checkOuts: Types.Array<ICheckOut>;
  breaks: Types.Array<IBreak>;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  status: AttendanceStatus;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  tasks: Types.Array<ITask>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateTotalHours(): number;
  isCurrentlyCheckedIn(): boolean;
  getCurrentBreak(): IBreak | null;
}

// Define the check-in subdocument interface
export interface ICheckInDocument extends Document {
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  isLate: boolean;
  lateMinutes: number;
  deviceInfo?: string;
  imageCapture?: string;
}

// Define the check-out subdocument interface
export interface ICheckOutDocument extends Document {
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  isEarly: boolean;
  earlyMinutes: number;
  tasksCompleted: boolean;
  deviceInfo?: string;
  imageCapture?: string;
}

// Define the break subdocument interface
export interface IBreakDocument extends Document {
  type: BreakType;
  start: Date;
  end?: Date;
  duration?: number;
  isPaid: boolean;
}

// Define the task subdocument interface
export interface ITaskDocument extends Document {
  description: string;
  timeAllocated: number;
  timeSpent: number;
  completed: boolean;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
}

// Define static methods interface
interface IAttendanceModel extends Model<IAttendanceDocument> {
  findByEmployee(employeeId: string, startDate?: Date, endDate?: Date): Promise<IAttendanceDocument[]>;
  findByDate(date: Date): Promise<IAttendanceDocument[]>;
  findCurrentAttendance(employeeId: string): Promise<IAttendanceDocument | null>;
  getAttendanceSummary(employeeId: string, startDate: Date, endDate: Date): Promise<any>;
}

// CheckIn Subdocument Schema
const CheckInSchema: Schema = new Schema({
  timestamp: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number },
    address: { type: String }
  },
  isLate: { 
    type: Boolean, 
    default: false 
  },
  lateMinutes: { 
    type: Number, 
    default: 0,
    min: 0
  },
  deviceInfo: { type: String },
  imageCapture: { type: String } // URL to check-in image
});

// CheckOut Subdocument Schema
const CheckOutSchema: Schema = new Schema({
  timestamp: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number },
    address: { type: String }
  },
  isEarly: { 
    type: Boolean, 
    default: false 
  },
  earlyMinutes: { 
    type: Number, 
    default: 0,
    min: 0
  },
  tasksCompleted: { 
    type: Boolean, 
    default: false 
  },
  deviceInfo: { type: String },
  imageCapture: { type: String } // URL to check-out image
});

// Break Subdocument Schema
const BreakSchema: Schema = new Schema({
  type: { 
    type: String, 
    enum: ['lunch', 'tea', 'rest', 'prayer', 'personal', 'emergency'],
    required: true 
  },
  start: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  end: { type: Date },
  duration: { 
    type: Number, 
    min: 0 
  }, // in minutes
  isPaid: { 
    type: Boolean, 
    default: false 
  }
});

// Task Subdocument Schema
const TaskSchema: Schema = new Schema({
  description: { 
    type: String, 
    required: true,
    maxlength: 500
  },
  timeAllocated: { 
    type: Number, 
    required: true,
    min: 1,
    max: 480 // 8 hours in minutes
  },
  timeSpent: { 
    type: Number, 
    default: 0,
    min: 0
  },
  completed: { 
    type: Boolean, 
    default: false 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
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

// Main Attendance Schema
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
    index: true
  },
  shift: { 
    type: String, 
    enum: ['morning', 'evening', 'night', 'custom'],
    required: true 
  },
  scheduledStart: { 
    type: Date, 
    required: true 
  },
  scheduledEnd: { 
    type: Date, 
    required: true 
  },
  checkIns: [CheckInSchema],
  checkOuts: [CheckOutSchema],
  breaks: [BreakSchema],
  totalHours: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 24
  },
  regularHours: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 24
  },
  overtimeHours: { 
    type: Number, 
    default: 0,
    min: 0
  },
  breakHours: { 
    type: Number, 
    default: 0,
    min: 0
  },
  status: { 
    type: String, 
    enum: [
      'present', 'absent', 'late', 'half-day', 'early-departure', 
      'on-break', 'holiday', 'weekend', 'leave'
    ],
    default: 'absent'
  },
  lateMinutes: { 
    type: Number, 
    default: 0,
    min: 0
  },
  earlyDepartureMinutes: { 
    type: Number, 
    default: 0,
    min: 0
  },
  tasks: [TaskSchema],
  notes: { 
    type: String,
    maxlength: 1000
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

// Indexes for better query performance
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1, status: 1 });
AttendanceSchema.index({ employeeId: 1, createdAt: -1 });
AttendanceSchema.index({ status: 1 });

// Pre-save middleware to update timestamps and calculate hours
AttendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate total hours if we have check-ins and check-outs
  if (this.checkIns.length > 0 && this.checkOuts.length > 0) {
    const lastCheckOut = this.checkOuts[this.checkOuts.length - 1].timestamp;
    const firstCheckIn = this.checkIns[0].timestamp;
    const totalMs = lastCheckOut.getTime() - firstCheckIn.getTime();
    this.totalHours = parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));
    
    // Calculate break hours
    this.breakHours = this.breaks.reduce((total, breakItem) => {
      if (breakItem.end) {
        const breakMs = breakItem.end.getTime() - breakItem.start.getTime();
        return total + (breakMs / (1000 * 60 * 60));
      }
      return total;
    }, 0);
    
    // Calculate regular hours (total hours minus breaks)
    this.regularHours = parseFloat((this.totalHours - this.breakHours).toFixed(2));
    
    // Calculate overtime (anything over 8 regular hours)
    this.overtimeHours = Math.max(0, this.regularHours - 8);
  }
  
  next();
});

// Pre-save middleware for breaks to calculate duration
BreakSchema.pre('save', function(next) {
  if (this.end && this.isModified('end')) {
    const durationMs = this.end.getTime() - this.start.getTime();
    this.duration = parseFloat((durationMs / (1000 * 60)).toFixed(2)); // in minutes
  }
  next();
});

// Pre-save middleware for tasks to update timestamp
TaskSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  next();
});

// Virtual for checking if attendance is active (currently checked in)
AttendanceSchema.virtual('isActive').get(function() {
  return this.checkIns.length > 0 && 
         (this.checkOuts.length === 0 || 
          this.checkOuts[this.checkOuts.length - 1].timestamp < 
          this.checkIns[this.checkIns.length - 1].timestamp);
});

// Virtual for current check-in status
AttendanceSchema.virtual('currentCheckIn').get(function() {
  if (this.checkIns.length > 0) {
    return this.checkIns[this.checkIns.length - 1];
  }
  return null;
});

// Static method to find attendance by employee
AttendanceSchema.statics.findByEmployee = function(
  employeeId: string, 
  startDate?: Date, 
  endDate?: Date
): Promise<IAttendanceDocument[]> {
  let query: any = { employeeId };
  
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    query.date = { $gte: startDate };
  } else if (endDate) {
    query.date = { $lte: endDate };
  }
  
  return this.find(query).sort({ date: -1 });
};

// Static method to find attendance by date
AttendanceSchema.statics.findByDate = function(date: Date): Promise<IAttendanceDocument[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({ 
    date: { $gte: startOfDay, $lte: endOfDay } 
  });
};

// Static method to find current attendance (today's record)
AttendanceSchema.statics.findCurrentAttendance = function(employeeId: string): Promise<IAttendanceDocument | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.findOne({ 
    employeeId, 
    date: today 
  });
};

// Static method to get attendance summary
AttendanceSchema.statics.getAttendanceSummary = async function(
  employeeId: string, 
  startDate: Date, 
  endDate: Date
): Promise<any> {
  const attendances = await this.findByEmployee(employeeId, startDate, endDate);
  
  const summary = {
    totalDays: attendances.length,
    presentDays: attendances.filter((a: { status: string; }) => a.status === 'present').length,
    absentDays: attendances.filter((a: { status: string; }) => a.status === 'absent').length,
    lateDays: attendances.filter((a: { lateMinutes: number; }) => a.lateMinutes > 0).length,
    earlyDepartureDays: attendances.filter((a: { earlyDepartureMinutes: number; }) => a.earlyDepartureMinutes > 0).length,
    totalRegularHours: attendances.reduce((sum: any, a: { regularHours: any; }) => sum + a.regularHours, 0),
    totalOvertimeHours: attendances.reduce((sum: any, a: { overtimeHours: any; }) => sum + a.overtimeHours, 0),
    averageHoursPerDay: attendances.length > 0 ? 
      parseFloat((attendances.reduce((sum: any, a: { regularHours: any; }) => sum + a.regularHours, 0) / attendances.length).toFixed(2)) : 0,
    attendanceRate: attendances.length > 0 ? 
      parseFloat(((attendances.filter((a: { status: string; }) => a.status === 'present').length / attendances.length) * 100).toFixed(2)) : 0
  };
  
  return summary;
};

// Instance method to calculate total hours
AttendanceSchema.methods.calculateTotalHours = function(): number {
  if (this.checkIns.length === 0 || this.checkOuts.length === 0) {
    return 0;
  }
  
  const lastCheckOut = this.checkOuts[this.checkOuts.length - 1].timestamp;
  const firstCheckIn = this.checkIns[0].timestamp;
  const totalMs = lastCheckOut.getTime() - firstCheckIn.getTime();
  
  return parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));
};

// Instance method to check if currently checked in
AttendanceSchema.methods.isCurrentlyCheckedIn = function(): boolean {
  return this.checkIns.length > 0 && 
         (this.checkOuts.length === 0 || 
          this.checkOuts[this.checkOuts.length - 1].timestamp < 
          this.checkIns[this.checkIns.length - 1].timestamp);
};

// Instance method to get current break
AttendanceSchema.methods.getCurrentBreak = function(): IBreak | null {
  const currentBreak = this.breaks.find((breakItem: IBreak) => 
    breakItem.start && !breakItem.end
  );
  
  return currentBreak || null;
};

const Attendance = (mongoose.models.Attendance as IAttendanceModel) || 
  mongoose.model<IAttendanceDocument, IAttendanceModel>('Attendance', AttendanceSchema);

export default Attendance;