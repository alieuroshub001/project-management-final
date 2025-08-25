// models/employee/Leave.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

// Define the interface that extends mongoose Document
export interface ILeaveDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  employeeEmail: string;
  employeeMobile: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewComments?: string;
  emergencyContact?: string;
  handoverNotes?: string;
  attachments?: Array<{
    public_id: string;
    secure_url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
    original_filename: string;
    created_at: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  canCancel(): boolean;
  getDuration(): number;
}

// Define static methods interface
interface ILeaveModel extends Model<ILeaveDocument> {
  findByEmployee(employeeId: string): Promise<ILeaveDocument[]>;
  findPending(): Promise<ILeaveDocument[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<ILeaveDocument[]>;
}

const LeaveSchema: Schema<ILeaveDocument> = new Schema({
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
  leaveType: { 
    type: String, 
    enum: [
      'annual', 'sick', 'casual', 'maternity', 'paternity', 
      'unpaid', 'compensatory', 'bereavement', 'sabbatical',
      'half-day', 'short-leave', 'time-off-in-lieu', 'jury-duty',
      'volunteer', 'religious'
    ], 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  totalDays: { 
    type: Number, 
    required: true,
    min: 0.5,
    max: 365
  },
  reason: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'in-review', 'awaiting-documents'],
    default: 'pending'
  },
  reviewedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reviewedByName: { 
    type: String 
  },
  reviewedAt: { 
    type: Date 
  },
  reviewComments: { 
    type: String,
    maxlength: 500
  },
  emergencyContact: { 
    type: String,
    maxlength: 20
  },
  handoverNotes: { 
    type: String,
    maxlength: 2000
  },
  attachments: [{
    public_id: { type: String, required: true },
    secure_url: { type: String, required: true },
    format: { type: String, required: true },
    resource_type: { type: String, required: true },
    bytes: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    original_filename: { type: String, required: true },
    created_at: { type: String, required: true }
  }],
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
LeaveSchema.index({ employeeId: 1, status: 1 });
LeaveSchema.index({ startDate: 1, endDate: 1 });
LeaveSchema.index({ leaveType: 1 });
LeaveSchema.index({ status: 1 });
LeaveSchema.index({ createdAt: -1 });

// Pre-save middleware to update timestamps
LeaveSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if leave is pending
LeaveSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

// Virtual for checking if leave is approved
LeaveSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

// Static method to find leaves by employee
LeaveSchema.statics.findByEmployee = function(employeeId: string) {
  return this.find({ employeeId }).sort({ createdAt: -1 });
};

// Static method to find pending leaves
LeaveSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: -1 });
};

// Static method to find leaves within date range
LeaveSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    $or: [
      { startDate: { $lte: endDate, $gte: startDate } },
      { endDate: { $lte: endDate, $gte: startDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
    ]
  });
};

// Instance method to check if leave can be cancelled
LeaveSchema.methods.canCancel = function(this: ILeaveDocument): boolean {
  const now = new Date();
  const startDate = this.startDate instanceof Date ? this.startDate : new Date(this.startDate);
  const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return this.status === 'pending' || (this.status === 'approved' && hoursUntilStart > 24);
};

// Instance method to get leave duration in days
LeaveSchema.methods.getDuration = function(this: ILeaveDocument): number {
  const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

const Leave: ILeaveModel = 
  (mongoose.models.Leave as ILeaveModel) || mongoose.model<ILeaveDocument, ILeaveModel>('Leave', LeaveSchema);

export default Leave;