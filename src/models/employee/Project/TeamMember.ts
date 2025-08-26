import mongoose, { Model, Schema } from "mongoose";

// models/employee/TeamMember.ts
export interface ITeamMemberDocument extends Document {
  _id: string | { toString(): string; };
  projectId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  employeeEmail: string;
  employeeMobile: string;
  role: string;
  permissions: string[];
  hourlyRate?: number;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  totalHoursLogged?: number;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  hasPermission(permission: string): boolean;
}

interface ITeamMemberModel extends Model<ITeamMemberDocument> {
  findByProject(projectId: string): Promise<ITeamMemberDocument[]>;
  findByEmployee(employeeId: string): Promise<ITeamMemberDocument[]>;
}

const TeamMemberSchema: Schema<ITeamMemberDocument> = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
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
  employeeEmail: {
    type: String,
    required: true
  },
  employeeMobile: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: [
      'project-manager', 'developer', 'designer', 'tester', 
      'analyst', 'client', 'observer', 'contributor'
    ],
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'view-project', 'edit-project', 'delete-project', 'manage-team',
      'create-tasks', 'edit-tasks', 'delete-tasks', 'assign-tasks',
      'comment', 'upload-files', 'track-time', 'view-reports'
    ]
  }],
  hourlyRate: {
    type: Number,
    min: 0
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalHoursLogged: {
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
TeamMemberSchema.index({ projectId: 1, employeeId: 1 }, { unique: true });
TeamMemberSchema.index({ projectId: 1, isActive: 1 });
TeamMemberSchema.index({ employeeId: 1, isActive: 1 });

// Pre-save middleware
TeamMemberSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
TeamMemberSchema.statics.findByProject = function(projectId: string) {
  return this.find({ projectId, isActive: true }).sort({ joinedAt: 1 });
};

TeamMemberSchema.statics.findByEmployee = function(employeeId: string) {
  return this.find({ employeeId, isActive: true }).populate('projectId');
};

// Instance methods
TeamMemberSchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes(permission);
};

const TeamMember: ITeamMemberModel = 
  (mongoose.models.TeamMember as ITeamMemberModel) || 
  mongoose.model<ITeamMemberDocument, ITeamMemberModel>('TeamMember', TeamMemberSchema);

export { TeamMember };