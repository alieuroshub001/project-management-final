import mongoose, { Schema, Model, Document } from 'mongoose';

// Define the interface that extends mongoose Document
export interface IProjectDocument extends Document {
  name: string;
  description: string;
  status: string;
  priority: string;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  createdByEmail: string;
  projectManager: mongoose.Types.ObjectId;
  projectManagerName: string;
  projectManagerEmail: string;
  startDate: Date;
  endDate: Date;
  estimatedHours: number;
  actualHours?: number;
  budget?: number;
  actualCost?: number;
  progress: number;
  category: string;
  tags?: string[];
  isArchived: boolean;
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
  isOverdue(): boolean;
  getCompletionPercentage(): number;
  canEdit(userId: string): boolean;
}

// Define static methods interface
interface IProjectModel extends Model<IProjectDocument> {
  findByManager(managerId: string): Promise<IProjectDocument[]>;
  findActiveProjects(): Promise<IProjectDocument[]>;
  findByCategory(category: string): Promise<IProjectDocument[]>;
  findOverdueProjects(): Promise<IProjectDocument[]>;
}

const ProjectSchema: Schema<IProjectDocument> = new Schema({
  name: {
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
    enum: ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled', 'review'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical', 'urgent'],
    default: 'medium'
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
  createdByEmail: {
    type: String,
    required: true
  },
  projectManager: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectManagerName: {
    type: String,
    required: true
  },
  projectManagerEmail: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(this: IProjectDocument, value: Date) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  estimatedHours: {
    type: Number,
    required: true,
    min: 1,
    max: 10000
  },
  actualHours: {
    type: Number,
    default: 0,
    min: 0
  },
  budget: {
    type: Number,
    min: 0
  },
  actualCost: {
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
      'web-development', 'mobile-app', 'design', 'marketing', 'research',
      'maintenance', 'infrastructure', 'testing', 'documentation', 'other'
    ],
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  isArchived: {
    type: Boolean,
    default: false
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
ProjectSchema.index({ projectManager: 1, status: 1 });
ProjectSchema.index({ createdBy: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ category: 1 });
ProjectSchema.index({ startDate: 1, endDate: 1 });
ProjectSchema.index({ priority: 1 });
ProjectSchema.index({ tags: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware
ProjectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// REMOVED the conflicting virtual property - keep only the instance method

// Static methods
ProjectSchema.statics.findByManager = function(managerId: string) {
  return this.find({ projectManager: managerId, isArchived: false }).sort({ createdAt: -1 });
};

ProjectSchema.statics.findActiveProjects = function() {
  return this.find({ 
    status: { $in: ['planning', 'in-progress', 'review'] },
    isArchived: false 
  }).sort({ priority: -1, createdAt: -1 });
};

ProjectSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, isArchived: false }).sort({ createdAt: -1 });
};

ProjectSchema.statics.findOverdueProjects = function() {
  return this.find({
    endDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] },
    isArchived: false
  });
};

// Instance methods
ProjectSchema.methods.isOverdue = function(): boolean {
  return new Date() > this.endDate && this.status !== 'completed';
};

ProjectSchema.methods.getCompletionPercentage = function(): number {
  return Math.min(100, Math.max(0, this.progress));
};

ProjectSchema.methods.canEdit = function(userId: string): boolean {
  return this.createdBy.toString() === userId || this.projectManager.toString() === userId;
};

const Project: IProjectModel = 
  (mongoose.models.Project as IProjectModel) || 
  mongoose.model<IProjectDocument, IProjectModel>('Project', ProjectSchema);

export default Project;