import mongoose, { Model, Schema } from "mongoose";

// models/Project/ProjectTemplate.ts
export interface IProjectTemplateDocument extends Document {
  _id: string | { toString(): string; };
  name: string;
  description: string;
  category: string;
  defaultTasks?: Array<{
    title: string;
    description: string;
    estimatedHours: number;
    category?: string;
    dependencies?: number[];
  }>;
  defaultMilestones?: Array<{
    title: string;
    description: string;
    dayOffset: number;
  }>;
  estimatedDuration: number;
  isPublic: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  incrementUsage(): Promise<void>;
  canEdit(userId: string): boolean;
}

interface IProjectTemplateModel extends Model<IProjectTemplateDocument> {
  findPublicTemplates(): Promise<IProjectTemplateDocument[]>;
  findByCreator(creatorId: string): Promise<IProjectTemplateDocument[]>;
  findByCategory(category: string): Promise<IProjectTemplateDocument[]>;
}

const ProjectTemplateSchema: Schema<IProjectTemplateDocument> = new Schema({
  name: {
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
  category: {
    type: String,
    enum: [
      'web-development', 'mobile-app', 'design', 'marketing', 'research',
      'maintenance', 'infrastructure', 'testing', 'documentation', 'other'
    ],
    required: true
  },
  defaultTasks: [{
    title: { type: String, required: true, maxlength: 255 },
    description: { type: String, required: true, maxlength: 1000 },
    estimatedHours: { type: Number, required: true, min: 0.5 },
    category: { 
      type: String, 
      enum: [
        'development', 'design', 'testing', 'documentation', 'review',
        'deployment', 'bug-fix', 'feature', 'research', 'meeting'
      ]
    },
    dependencies: [{ type: Number }]
  }],
  defaultMilestones: [{
    title: { type: String, required: true, maxlength: 255 },
    description: { type: String, required: true, maxlength: 1000 },
    dayOffset: { type: Number, required: true, min: 0 }
  }],
  estimatedDuration: {
    type: Number,
    required: true,
    min: 1
  },
  isPublic: {
    type: Boolean,
    default: false
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
  usageCount: {
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

// Indexes
ProjectTemplateSchema.index({ isPublic: 1, category: 1 });
ProjectTemplateSchema.index({ createdBy: 1 });
ProjectTemplateSchema.index({ usageCount: -1 });
ProjectTemplateSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware
ProjectTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
ProjectTemplateSchema.statics.findPublicTemplates = function() {
  return this.find({ isPublic: true }).sort({ usageCount: -1, createdAt: -1 });
};

ProjectTemplateSchema.statics.findByCreator = function(creatorId: string) {
  return this.find({ createdBy: creatorId }).sort({ createdAt: -1 });
};

ProjectTemplateSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, isPublic: true }).sort({ usageCount: -1 });
};

// Instance methods
ProjectTemplateSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  await this.save();
};

ProjectTemplateSchema.methods.canEdit = function(userId: string): boolean {
  return this.createdBy.toString() === userId;
};

const ProjectTemplate: IProjectTemplateModel = 
  (mongoose.models.ProjectTemplate as IProjectTemplateModel) || 
  mongoose.model<IProjectTemplateDocument, IProjectTemplateModel>('ProjectTemplate', ProjectTemplateSchema);

export { ProjectTemplate };