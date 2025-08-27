import mongoose, { Model, Schema } from "mongoose";

export interface ITaskDocument extends Document {
  _id: string | { toString(): string; };
  projectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: mongoose.Types.ObjectId;
  assignedToName?: string;
  assignedToEmail?: string;
  assignedBy: mongoose.Types.ObjectId;
  assignedByName: string;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  estimatedHours: number;
  actualHours?: number;
  progress: number;
  category?: string;
  tags?: string[];
  parentTaskId?: mongoose.Types.ObjectId;
  dependencies?: mongoose.Types.ObjectId[];
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
  checklist?: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
    completedBy?: string;
    completedByName?: string;
    completedAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isOverdue(): boolean;
  canComplete(): boolean;
  getDaysRemaining(): number;
}

interface ITaskModel extends Model<ITaskDocument> {
  findByProject(projectId: string): Promise<ITaskDocument[]>;
  findByAssignee(assigneeId: string): Promise<ITaskDocument[]>;
  findOverdueTasks(): Promise<ITaskDocument[]>;
  findBlockedTasks(): Promise<ITaskDocument[]>;
}

const TaskSchema: Schema<ITaskDocument> = new Schema({
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
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'in-review', 'completed', 'cancelled', 'blocked', 'on-hold'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedToName: {
    type: String
  },
  assignedToEmail: {
    type: String
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedByName: {
    type: String,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    required: true,
    min: 0.5,
    max: 500
  },
  actualHours: {
    type: Number,
    default: 0,
    min: 0
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  category: {
    type: String,
    enum: [
      'development', 'design', 'testing', 'documentation', 'review',
      'deployment', 'bug-fix', 'feature', 'research', 'meeting'
    ]
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  parentTaskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task'
  },
  dependencies: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
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
  checklist: [{
    id: { type: String, required: true },
    title: { type: String, required: true, maxlength: 255 },
    isCompleted: { type: Boolean, default: false },
    completedBy: { type: String },
    completedByName: { type: String },
    completedAt: { type: Date }
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

// Indexes
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ parentTaskId: 1 });
TaskSchema.index({ dependencies: 1 });
TaskSchema.index({ createdAt: -1 });
TaskSchema.index({ title: 'text', description: 'text' });

// Pre-save middleware
TaskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    this.progress = 100;
  }
  next();
});

// Static methods
TaskSchema.statics.findByProject = function(projectId: string) {
  return this.find({ projectId }).sort({ priority: -1, createdAt: -1 });
};

TaskSchema.statics.findByAssignee = function(assigneeId: string) {
  return this.find({ assignedTo: assigneeId }).sort({ dueDate: 1, priority: -1 });
};

TaskSchema.statics.findOverdueTasks = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  });
};

TaskSchema.statics.findBlockedTasks = function() {
  return this.find({ status: 'blocked' });
};

// Instance methods
TaskSchema.methods.isOverdue = function(): boolean {
  return this.dueDate && new Date() > this.dueDate && this.status !== 'completed';
};

TaskSchema.methods.canComplete = function(): boolean {
  return this.status !== 'completed' && this.status !== 'cancelled';
};

TaskSchema.methods.getDaysRemaining = function(): number {
  if (!this.dueDate) return Infinity;
  const diffTime = this.dueDate.getTime() - new Date().getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const Task: ITaskModel = 
  (mongoose.models.Task as ITaskModel) || 
  mongoose.model<ITaskDocument, ITaskModel>('Task', TaskSchema);

export { Task };