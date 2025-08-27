import mongoose, { Model, Schema } from "mongoose";

// models/employee/ProjectActivity.ts
export interface IProjectActivityDocument extends Document {
  _id: any;
  projectId: mongoose.Types.ObjectId;
  activityType: string;
  description: string;
  performedBy: mongoose.Types.ObjectId;
  performedByName: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

interface IProjectActivityModel extends Model<IProjectActivityDocument> {
  findByProject(projectId: string, limit?: number): Promise<IProjectActivityDocument[]>;
  createActivity(data: Partial<IProjectActivityDocument>): Promise<IProjectActivityDocument>;
}

const ProjectActivitySchema: Schema<IProjectActivityDocument> = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  activityType: {
    type: String,
    enum: [
      'project-created', 'project-updated', 'project-completed',
      'task-created', 'task-updated', 'task-assigned', 'task-completed',
      'member-added', 'member-removed', 'comment-added', 'file-uploaded',
      'milestone-created', 'milestone-completed', 'time-logged'
    ],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByName: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    enum: ['project', 'task', 'comment', 'team-member', 'milestone', 'time-entry'],
    required: true
  },
  entityId: {
    type: String,
    required: true
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
ProjectActivitySchema.index({ projectId: 1, createdAt: -1 });
ProjectActivitySchema.index({ performedBy: 1, createdAt: -1 });
ProjectActivitySchema.index({ activityType: 1 });

// Static methods
ProjectActivitySchema.statics.findByProject = function(projectId: string, limit: number = 50) {
  return this.find({ projectId }).sort({ createdAt: -1 }).limit(limit);
};

ProjectActivitySchema.statics.createActivity = function(data: Partial<IProjectActivityDocument>) {
  return this.create(data);
};

const ProjectActivity: IProjectActivityModel = 
  (mongoose.models.ProjectActivity as IProjectActivityModel) || 
  mongoose.model<IProjectActivityDocument, IProjectActivityModel>('ProjectActivity', ProjectActivitySchema);

export { ProjectActivity };