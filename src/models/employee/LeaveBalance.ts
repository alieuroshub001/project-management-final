// models/employee/LeaveBalance.ts
import mongoose, { Schema, Model, Document } from 'mongoose';
import type { ILeaveBalance } from '@/types/employee/leave';

// Define the document interface that extends mongoose Document
export interface ILeaveBalanceDocument extends Document {
  total: any;
  used: any;
  remaining: any;
  employeeId: mongoose.Types.ObjectId;
  year: number;
  annualLeave: number;
  sickLeave: number;
  casualLeave: number;
  maternityLeave: number;
  paternityLeave: number;
  unpaidLeave: number;
  compensatoryLeave: number;
  bereavementLeave: number;
  sabbaticalLeave: number;
  halfDayLeave: number;
  shortLeave: number;
  usedAnnualLeave: number;
  usedSickLeave: number;
  usedCasualLeave: number;
  usedMaternityLeave: number;
  usedPaternityLeave: number;
  usedUnpaidLeave: number;
  usedCompensatoryLeave: number;
  usedBereavementLeave: number;
  usedSabbaticalLeave: number;
  usedHalfDayLeave: number;
  usedShortLeave: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  remainingAnnualLeave: number;
  remainingSickLeave: number;
  remainingCasualLeave: number;
}

// Define static methods interface
interface ILeaveBalanceModel extends mongoose.Model<ILeaveBalanceDocument> {
  getOrCreate(employeeId: string, year: number): Promise<ILeaveBalanceDocument>;
}

const LeaveBalanceSchema: Schema<ILeaveBalanceDocument> = new Schema({
  employeeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  year: { 
    type: Number, 
    required: true,
    min: 2020,
    max: 2100
  },
  annualLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  sickLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  casualLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  maternityLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  paternityLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  unpaidLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  compensatoryLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  bereavementLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  sabbaticalLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  halfDayLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  shortLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  usedAnnualLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  usedSickLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  usedCasualLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  usedMaternityLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  usedPaternityLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  usedUnpaidLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  usedCompensatoryLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  usedBereavementLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  usedSabbaticalLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  usedHalfDayLeave: { 
    type: Number, 
    default: 0,
    min: 0
  },
  usedShortLeave: { 
    type: Number, 
    default: 0,
    min: 0
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

// Compound index for employee and year
LeaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

// Pre-save middleware
LeaveBalanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for remaining leaves
LeaveBalanceSchema.virtual('remainingAnnualLeave').get(function(this: ILeaveBalanceDocument) {
  return Math.max(0, this.annualLeave - this.usedAnnualLeave);
});

LeaveBalanceSchema.virtual('remainingSickLeave').get(function(this: ILeaveBalanceDocument) {
  return Math.max(0, this.sickLeave - this.usedSickLeave);
});

LeaveBalanceSchema.virtual('remainingCasualLeave').get(function(this: ILeaveBalanceDocument) {
  return Math.max(0, this.casualLeave - this.usedCasualLeave);
});

// Static method to get or create balance for employee and year
LeaveBalanceSchema.statics.getOrCreate = async function(
  this: mongoose.Model<ILeaveBalanceDocument>, 
  employeeId: string, 
  year: number
): Promise<ILeaveBalanceDocument> {
  let balance = await this.findOne({ employeeId, year });
  
  if (!balance) {
    balance = await this.create({
      employeeId,
      year,
      // Set default values based on your leave policy
      annualLeave: 20,
      sickLeave: 12,
      casualLeave: 10,
      maternityLeave: 90,
      paternityLeave: 14,
      unpaidLeave: 0,
      compensatoryLeave: 5,
      bereavementLeave: 5,
      sabbaticalLeave: 0,
      halfDayLeave: 0,
      shortLeave: 0,
      // Used leaves start at 0
      usedAnnualLeave: 0,
      usedSickLeave: 0,
      usedCasualLeave: 0,
      usedMaternityLeave: 0,
      usedPaternityLeave: 0,
      usedUnpaidLeave: 0,
      usedCompensatoryLeave: 0,
      usedBereavementLeave: 0,
      usedSabbaticalLeave: 0,
      usedHalfDayLeave: 0,
      usedShortLeave: 0
    });
  }
  
  return balance;
};

const LeaveBalance = (mongoose.models.LeaveBalance as ILeaveBalanceModel) ||
  mongoose.model<ILeaveBalanceDocument, ILeaveBalanceModel>('LeaveBalance', LeaveBalanceSchema) as ILeaveBalanceModel;

export default LeaveBalance;