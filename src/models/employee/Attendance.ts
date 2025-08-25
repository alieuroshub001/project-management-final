// models/employee/Attendance.ts
import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import type { 
  IAttendance, 
  IShift, 
  IBreak, 
  INamazBreak, 
  ITask, 
  IGeoLocation,
  IShiftCalendar,
  IShiftSchedule,
  IEmployeeShiftAssignment,
  IDayOff,
  IHoliday,
  AttendanceStatus,
  CheckInStatus,
  BreakType,
  NamazType,
  TaskStatus,
  DayOfWeek
} from '@/types/employee/attendance';

// GeoLocation Schema
const GeoLocationSchema = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number },
  timestamp: { type: Date, required: true },
  address: { type: String }
}, { _id: false });

// Break Schema
const BreakSchema = new Schema({
  attendanceId: { type: Schema.Types.ObjectId, ref: 'Attendance', required: true },
  breakType: { 
    type: String, 
    enum: ['general', 'lunch', 'tea', 'personal', 'other'],
    required: true 
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number }, // In minutes
  reason: { type: String },
  // For namaz breaks
  namazType: {
    type: String,
    enum: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Task Schema
const TaskSchema = new Schema({
  attendanceId: { type: Schema.Types.ObjectId, ref: 'Attendance', required: true },
  description: { type: String, required: true, maxlength: 500 },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  timeSpent: { type: Number }, // In minutes
  status: { 
    type: String, 
    enum: ['in-progress', 'completed', 'pending', 'cancelled'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Shift Schema
const ShiftSchema = new Schema({
  name: { type: String, required: true },
  startTime: { 
    type: String, 
    required: true,
    validate: {
      validator: (v: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
      message: 'Start time must be in HH:mm format'
    }
  },
  endTime: { 
    type: String, 
    required: true,
    validate: {
      validator: (v: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
      message: 'End time must be in HH:mm format'
    }
  },
  gracePeriod: { type: Number, default: 15, min: 0, max: 120 }, // Minutes
  isNightShift: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Holiday Schema
const HolidaySchema = new Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String },
  isRecurring: { type: Boolean, default: false },
  recurringType: {
    type: String,
    enum: ['yearly', 'monthly', 'weekly']
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Day Off Schema
const DayOffSchema = new Schema({
  calendarId: { type: Schema.Types.ObjectId, ref: 'ShiftCalendar', required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  isRecurring: { type: Boolean, default: false },
  recurringType: {
    type: String,
    enum: ['yearly', 'monthly', 'weekly']
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Shift Schedule Schema
const ShiftScheduleSchema = new Schema({
  calendarId: { type: Schema.Types.ObjectId, ref: 'ShiftCalendar', required: true },
  shiftId: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  isActive: { type: Boolean, default: true },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Shift Calendar Schema
const ShiftCalendarSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  year: { type: Number, required: true, min: 2020, max: 2100 },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Employee Shift Assignment Schema
const EmployeeShiftAssignmentSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  shiftId: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
  calendarId: { type: Schema.Types.ObjectId, ref: 'ShiftCalendar', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Main Attendance Schema
const AttendanceSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  employeeName: { type: String, required: true },
  employeeEmail: { type: String, required: true },
  employeeMobile: { type: String, required: true },
  date: { type: Date, required: true }, // The date of attendance record
  shiftId: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
  shiftName: { type: String, required: true },
  shiftStartTime: { type: String, required: true },
  shiftEndTime: { type: String, required: true },
  
  // Check-in/out details
  checkIn: { type: Date, required: true },
  checkOut: { type: Date },
  checkInLocation: GeoLocationSchema,
  checkOutLocation: GeoLocationSchema,
  checkInReason: { type: String }, // Reason for late check-in
  checkInStatus: {
    type: String,
    enum: ['on-time', 'late', 'early', 'no-check-in', 'no-check-out'],
    required: true
  },
  
  // Break details (embedded)
  breaks: [BreakSchema],
  namazBreaks: [BreakSchema], // Same schema but will have namazType field
  
  // Work details
  totalHours: { type: Number, default: 0, min: 0 },
  actualWorkHours: { type: Number, default: 0, min: 0 },
  overtimeHours: { type: Number, default: 0, min: 0 },
  
  // Task details (embedded)
  tasks: [TaskSchema],
  
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'on-leave', 'holiday', 'weekend'],
    default: 'present'
  },
  notes: { type: String, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Document interfaces - Omit 'id' from the original interfaces to avoid conflicts
export interface IAttendanceDocument extends Omit<IAttendance, 'id'>, Document {
  calculateHours(): void;
  isLate(): boolean;
  canCheckOut(): boolean;
  addTask(task: Omit<ITask, 'id' | 'attendanceId' | 'createdAt' | 'updatedAt'>): void;
  startBreak(breakType: BreakType, namazType?: NamazType): string;
  endBreak(breakId: string): void;
}

export interface IShiftDocument extends Omit<IShift, 'id'>, Document {
  isCurrentlyActive(): boolean;
  getNextShift(): Date | null;
}

export interface IBreakDocument extends Omit<IBreak, 'id'>, Document {}
export interface ITaskDocument extends Omit<ITask, 'id'>, Document {}
export interface IHolidayDocument extends Omit<IHoliday, 'id'>, Document {}
export interface IDayOffDocument extends Omit<IDayOff, 'id'>, Document {}
export interface IShiftCalendarDocument extends Omit<IShiftCalendar, 'id' | 'shifts'>, Document {
  shifts?: Types.ObjectId[];
}
export interface IShiftScheduleDocument extends Omit<IShiftSchedule, 'id' | 'shift'>, Document {
  shift?: Types.ObjectId;
}
export interface IEmployeeShiftAssignmentDocument extends Omit<IEmployeeShiftAssignment, 'id' | 'shift' | 'calendar'>, Document {
  shift?: Types.ObjectId;
  calendar?: Types.ObjectId;
}

// Model interfaces for static methods
interface IAttendanceModel extends Model<IAttendanceDocument> {
  findByEmployee(employeeId: string, startDate?: Date, endDate?: Date): Promise<IAttendanceDocument[]>;
  findByDate(date: Date): Promise<IAttendanceDocument[]>;
  getTodayAttendance(employeeId: string): Promise<IAttendanceDocument | null>;
  getMonthlyAttendance(employeeId: string, year: number, month: number): Promise<IAttendanceDocument[]>;
}

interface IShiftModel extends Model<IShiftDocument> {
  findActive(): Promise<IShiftDocument[]>;
  findByTime(time: string): Promise<IShiftDocument[]>;
}

// Indexes
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ employeeId: 1, createdAt: -1 });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ status: 1 });
AttendanceSchema.index({ shiftId: 1, date: 1 });

ShiftSchema.index({ name: 1 }, { unique: true });
ShiftSchema.index({ isActive: 1 });

ShiftCalendarSchema.index({ year: 1, isDefault: 1 });
ShiftScheduleSchema.index({ calendarId: 1, dayOfWeek: 1 });
EmployeeShiftAssignmentSchema.index({ employeeId: 1, startDate: 1 });
HolidaySchema.index({ date: 1 });
DayOffSchema.index({ calendarId: 1, date: 1 });

// Pre-save middleware
AttendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  (this as any).calculateHours();
  next();
});

ShiftSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

ShiftCalendarSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

ShiftScheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

EmployeeShiftAssignmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

HolidaySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

DayOffSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
AttendanceSchema.methods.calculateHours = function() {
  if (!this.checkIn) return;
  
  const checkInTime = new Date(this.checkIn);
  const checkOutTime = this.checkOut ? new Date(this.checkOut) : new Date();
  
  // Calculate total hours
  const totalMs = checkOutTime.getTime() - checkInTime.getTime();
  this.totalHours = totalMs / (1000 * 60 * 60);
  
  // Calculate break time
  let totalBreakTime = 0;
  [...this.breaks, ...this.namazBreaks].forEach((break_: any) => {
    if (break_.endTime) {
      const breakMs = new Date(break_.endTime).getTime() - new Date(break_.startTime).getTime();
      totalBreakTime += breakMs / (1000 * 60 * 60);
    }
  });
  
  // Calculate actual work hours
  this.actualWorkHours = Math.max(0, this.totalHours - totalBreakTime);
  
  // Calculate overtime (assuming 8 hours is standard)
  this.overtimeHours = Math.max(0, this.actualWorkHours - 8);
};

AttendanceSchema.methods.isLate = function(): boolean {
  return this.checkInStatus === 'late';
};

AttendanceSchema.methods.canCheckOut = function(): boolean {
  return !!this.checkIn && !this.checkOut;
};

AttendanceSchema.methods.addTask = function(
  task: Omit<ITask, 'id' | 'attendanceId' | 'createdAt' | 'updatedAt'>
) {
  const newTask = {
    ...task,
    attendanceId: this._id.toString(),
    timeSpent: task.timeSpent || (task.endTime && task.startTime ? 
      Math.round((new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60)) : 0),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  this.tasks.push(newTask);
};

AttendanceSchema.methods.startBreak = function(
  breakType: BreakType, 
  namazType?: NamazType
): string {
  const breakData = {
    attendanceId: this._id.toString(),
    breakType,
    startTime: new Date(),
    namazType,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  if (namazType) {
    this.namazBreaks.push(breakData);
    return this.namazBreaks[this.namazBreaks.length - 1]._id.toString();
  } else {
    this.breaks.push(breakData);
    return this.breaks[this.breaks.length - 1]._id.toString();
  }
};

AttendanceSchema.methods.endBreak = function(breakId: string) {
  const endTime = new Date();
  
  // Try to find in regular breaks
  const regularBreak = this.breaks.find((b: any) => b._id.toString() === breakId);
  if (regularBreak) {
    regularBreak.endTime = endTime;
    const duration = Math.round((endTime.getTime() - new Date(regularBreak.startTime).getTime()) / (1000 * 60));
    regularBreak.duration = duration;
    regularBreak.updatedAt = endTime;
    return;
  }
  
  // Try to find in namaz breaks
  const namazBreak = this.namazBreaks.find((b: any) => b._id.toString() === breakId);
  if (namazBreak) {
    namazBreak.endTime = endTime;
    const duration = Math.round((endTime.getTime() - new Date(namazBreak.startTime).getTime()) / (1000 * 60));
    namazBreak.duration = duration;
    namazBreak.updatedAt = endTime;
  }
};

// Static methods
AttendanceSchema.static('findByEmployee', function(
  employeeId: string, 
  startDate?: Date, 
  endDate?: Date
) {
  const query: any = { employeeId };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  
  return this.find(query).sort({ date: -1 });
});

AttendanceSchema.static('findByDate', function(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
});

AttendanceSchema.static('getTodayAttendance', function(employeeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.findOne({
    employeeId,
    date: {
      $gte: today,
      $lt: tomorrow
    }
  });
});

AttendanceSchema.static('getMonthlyAttendance', function(
  employeeId: string, 
  year: number, 
  month: number
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.find({
    employeeId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
});

ShiftSchema.static('findActive', function() {
  return this.find({ isActive: true });
});

ShiftSchema.static('findByTime', function(time: string) {
  return this.find({
    $or: [
      { startTime: { $lte: time }, endTime: { $gte: time } },
      { isNightShift: true, $or: [
        { startTime: { $lte: time } },
        { endTime: { $gte: time } }
      ]}
    ],
    isActive: true
  });
});

ShiftSchema.methods.isCurrentlyActive = function(): boolean {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  if (this.isNightShift) {
    // Night shift logic - spans across midnight
    return currentTime >= this.startTime || currentTime <= this.endTime;
  } else {
    return currentTime >= this.startTime && currentTime <= this.endTime;
  }
};

ShiftSchema.methods.getNextShift = function(): Date | null {
  const now = new Date();
  const [hours, minutes] = this.startTime.split(':').map(Number);
  
  const nextShift = new Date(now);
  nextShift.setHours(hours, minutes, 0, 0);
  
  // If the shift time has passed today, schedule for tomorrow
  if (nextShift <= now) {
    nextShift.setDate(nextShift.getDate() + 1);
  }
  
  return nextShift;
};

// Create models
const Attendance: IAttendanceModel = 
  (mongoose.models.Attendance as IAttendanceModel) || 
  mongoose.model<IAttendanceDocument, IAttendanceModel>('Attendance', AttendanceSchema);

const Shift: IShiftModel = 
  (mongoose.models.Shift as IShiftModel) || 
  mongoose.model<IShiftDocument, IShiftModel>('Shift', ShiftSchema);

const Break = mongoose.models.Break || mongoose.model<IBreakDocument>('Break', BreakSchema);
const Task = mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);
const Holiday = mongoose.models.Holiday || mongoose.model<IHolidayDocument>('Holiday', HolidaySchema);
const DayOff = mongoose.models.DayOff || mongoose.model<IDayOffDocument>('DayOff', DayOffSchema);
const ShiftCalendar = mongoose.models.ShiftCalendar || mongoose.model<IShiftCalendarDocument>('ShiftCalendar', ShiftCalendarSchema);
const ShiftSchedule = mongoose.models.ShiftSchedule || mongoose.model<IShiftScheduleDocument>('ShiftSchedule', ShiftScheduleSchema);
const EmployeeShiftAssignment = mongoose.models.EmployeeShiftAssignment || mongoose.model<IEmployeeShiftAssignmentDocument>('EmployeeShiftAssignment', EmployeeShiftAssignmentSchema);

export default Attendance;
export { 
  Shift, 
  Break, 
  Task, 
  Holiday, 
  DayOff, 
  ShiftCalendar, 
  ShiftSchedule, 
  EmployeeShiftAssignment 
};