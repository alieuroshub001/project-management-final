import mongoose, { Model, Schema } from "mongoose";

// models/employee/Milestone.ts
export interface IMilestoneDocument extends Document {
  _id: string | { toString(): string; };
  projectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  dueDate: Date;
  status: string;
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  completedByName?: string;
  tasks?: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isOverdue(): boolean;
  getTasksProgress(): Promise<{ completed: number; total: number; percentage: number }>;
}

interface IMilestoneModel extends Model<IMilestoneDocument> {
  findByProject(projectId: string): Promise<IMilestoneDocument[]>;
  findUpcoming(days?: number): Promise<IMilestoneDocument[]>;
  findOverdue(): Promise<IMilestoneDocument[]>;
}

const MilestoneSchema: Schema<IMilestoneDocument> = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'overdue', 'cancelled'],
    default: 'pending'
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  completedByName: {
    type: String
  },
  tasks: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true
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
MilestoneSchema.index({ projectId: 1, dueDate: 1 });
MilestoneSchema.index({ status: 1 });
MilestoneSchema.index({ dueDate: 1 });

// Pre-save middleware
MilestoneSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Static methods
MilestoneSchema.statics.findByProject = function(projectId: string) {
  return this.find({ projectId }).sort({ dueDate: 1 });
};

MilestoneSchema.statics.findUpcoming = function(days: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    dueDate: { $lte: futureDate, $gte: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  }).sort({ dueDate: 1 });
};

MilestoneSchema.statics.findOverdue = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  });
};

// Instance methods
MilestoneSchema.methods.isOverdue = function(): boolean {
  return new Date() > this.dueDate && this.status !== 'completed';
};

MilestoneSchema.methods.getTasksProgress = async function() {
  if (!this.tasks || this.tasks.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const Task = mongoose.model('Task');
  const tasks = await Task.find({ _id: { $in: this.tasks } });
  const completed = tasks.filter(task => task.status === 'completed').length;
  const total = tasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
};

const Milestone: IMilestoneModel = 
  (mongoose.models.Milestone as IMilestoneModel) || 
  mongoose.model<IMilestoneDocument, IMilestoneModel>('Milestone', MilestoneSchema);

export { Milestone };
