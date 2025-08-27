import mongoose, { Model, Schema } from "mongoose";

// models/employee/TimeEntry.ts
export interface ITimeEntryDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  hourlyRate?: number;
  billableAmount?: number;
  isBillable: boolean;
  status: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedByName?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateAmount(): number;
  isRunning(): boolean;
}

interface ITimeEntryModel extends Model<ITimeEntryDocument> {
  findByProject(projectId: string): Promise<ITimeEntryDocument[]>;
  findByEmployee(employeeId: string): Promise<ITimeEntryDocument[]>;
  findRunningEntries(employeeId: string): Promise<ITimeEntryDocument[]>;
}

const TimeEntrySchema: Schema<ITimeEntryDocument> = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task'
  },
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  },
  hourlyRate: {
    type: Number,
    min: 0
  },
  billableAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  isBillable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedByName: {
    type: String
  },
  approvedAt: {
    type: Date
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

// Indexes
TimeEntrySchema.index({ projectId: 1, employeeId: 1 });
TimeEntrySchema.index({ employeeId: 1, startTime: -1 });
TimeEntrySchema.index({ status: 1 });

// Pre-save middleware
TimeEntrySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate billable amount if hourly rate is set
  if (this.hourlyRate && this.isBillable) {
    const hours = this.duration / 60; // duration is in minutes
    this.billableAmount = hours * this.hourlyRate;
  }
  
  next();
});

// Static methods
TimeEntrySchema.statics.findByProject = function(projectId: string) {
  return this.find({ projectId }).sort({ startTime: -1 });
};

TimeEntrySchema.statics.findByEmployee = function(employeeId: string) {
  return this.find({ employeeId }).sort({ startTime: -1 });
};

TimeEntrySchema.statics.findRunningEntries = function(employeeId: string) {
  return this.find({ employeeId, endTime: null });
};

// Instance methods
TimeEntrySchema.methods.calculateAmount = function(): number {
  if (!this.hourlyRate || !this.isBillable) return 0;
  const hours = this.duration / 60;
  return hours * this.hourlyRate;
};

TimeEntrySchema.methods.isRunning = function(): boolean {
  return !this.endTime;
};

const TimeEntry: ITimeEntryModel = 
  (mongoose.models.TimeEntry as ITimeEntryModel) || 
  mongoose.model<ITimeEntryDocument, ITimeEntryModel>('TimeEntry', TimeEntrySchema);

export { TimeEntry };