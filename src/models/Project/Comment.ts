import mongoose, { Model, Schema } from "mongoose";

// models/employee/Comment.ts
export interface ICommentDocument extends Document {
  _id: string | { toString(): string; };
  projectId?: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  commentType: string;
  content: string;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorEmail: string;
  parentCommentId?: mongoose.Types.ObjectId;
  mentions?: string[];
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
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  canEdit(userId: string): boolean;
  canDelete(userId: string): boolean;
}

interface ICommentModel extends Model<ICommentDocument> {
  findByProject(projectId: string): Promise<ICommentDocument[]>;
  findByTask(taskId: string): Promise<ICommentDocument[]>;
}

const CommentSchema: Schema<ICommentDocument> = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task'
  },
  commentType: {
    type: String,
    enum: ['project-comment', 'task-comment', 'general', 'feedback', 'question', 'announcement'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorEmail: {
    type: String,
    required: true
  },
  parentCommentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  mentions: [{
    type: String
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
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
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
CommentSchema.index({ projectId: 1, createdAt: -1 });
CommentSchema.index({ taskId: 1, createdAt: -1 });
CommentSchema.index({ authorId: 1 });
CommentSchema.index({ parentCommentId: 1 });

// Pre-save middleware
CommentSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  this.updatedAt = new Date();
  next();
});

// Static methods
CommentSchema.statics.findByProject = function(projectId: string) {
  return this.find({ projectId }).sort({ createdAt: -1 });
};

CommentSchema.statics.findByTask = function(taskId: string) {
  return this.find({ taskId }).sort({ createdAt: -1 });
};

// Instance methods
CommentSchema.methods.canEdit = function(userId: string): boolean {
  return this.authorId.toString() === userId;
};

CommentSchema.methods.canDelete = function(userId: string): boolean {
  return this.authorId.toString() === userId;
};

const Comment: ICommentModel = 
  (mongoose.models.Comment as ICommentModel) || 
  mongoose.model<ICommentDocument, ICommentModel>('Comment', CommentSchema);

export { Comment };
