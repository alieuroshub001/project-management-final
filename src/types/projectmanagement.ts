import { IApiResponse, ISessionUser } from ".";

// Cloudinary File Interfaces (if not available from main index)
export interface ICloudinaryFile {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  original_filename: string;
  created_at: string;
}

export interface ICloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  original_filename: string;
}

export type FileUploadProgress = {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
};

export interface IFileUploadState {
  files: FileUploadProgress[];
  isUploading: boolean;
  totalProgress: number;
}

export interface IFileUploadResponse {
  success: boolean;
  files: ICloudinaryFile[];
  message?: string;
}

export interface IFileDeleteResponse {
  success: boolean;
  deletedFiles: string[];
  message?: string;
}

// Core Project Interface
export interface IProject {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
  projectManager: string;
  projectManagerName: string;
  projectManagerEmail: string;
  startDate: Date;
  endDate: Date;
  estimatedHours: number;
  actualHours?: number;
  budget?: number;
  actualCost?: number;
  progress: number; // 0-100
  category: ProjectCategory;
  tags?: string[];
  isArchived: boolean;
  attachments?: ICloudinaryFile[];
  createdAt: Date;
  updatedAt: Date;
}

// Team Member Interface
export interface ITeamMember {
  id: string;
  projectId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeMobile: string;
  role: TeamRole;
  permissions: TeamPermission[];
  hourlyRate?: number;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  totalHoursLogged?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Task Interface
export interface ITask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  assignedToName?: string;
  assignedToEmail?: string;
  assignedBy: string;
  assignedByName: string;
  createdBy: string;
  createdByName: string;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  estimatedHours: number;
  actualHours?: number;
  progress: number; // 0-100
  category?: TaskCategory;
  tags?: string[];
  parentTaskId?: string; // For subtasks
  dependencies?: string[]; // Task IDs that must be completed first
  attachments?: ICloudinaryFile[];
  checklist?: ITaskChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Task Checklist Item
export interface ITaskChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  completedBy?: string;
  completedByName?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Comment Interface
export interface IComment {
  id: string;
  projectId?: string;
  taskId?: string;
  commentType: CommentType;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  parentCommentId?: string; // For replies
  mentions?: string[]; // User IDs mentioned in comment
  attachments?: ICloudinaryFile[];
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Time Tracking Interface
export interface ITimeEntry {
  id: string;
  projectId: string;
  taskId?: string;
  employeeId: string;
  employeeName: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  hourlyRate?: number;
  billableAmount?: number;
  isBillable: boolean;
  status: TimeEntryStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Project Activity/Timeline Interface
export interface IProjectActivity {
  id: string;
  projectId: string;
  activityType: ActivityType;
  description: string;
  performedBy: string;
  performedByName: string;
  entityType: EntityType; // project, task, comment, etc.
  entityId: string;
  metadata?: Record<string, any>; // Additional context data
  createdAt: Date;
}

// Project Milestone Interface
export interface IMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: Date;
  status: MilestoneStatus;
  completedAt?: Date;
  completedBy?: string;
  completedByName?: string;
  tasks?: string[]; // Task IDs associated with milestone
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Project Template Interface
export interface IProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  defaultTasks?: ITaskTemplate[];
  defaultMilestones?: IMilestoneTemplate[];
  estimatedDuration: number; // in days
  isPublic: boolean;
  createdBy: string;
  createdByName: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskTemplate {
  title: string;
  description: string;
  estimatedHours: number;
  category?: TaskCategory;
  dependencies?: number[]; // Indices of other tasks in the template
}

export interface IMilestoneTemplate {
  title: string;
  description: string;
  dayOffset: number; // Days from project start
}

// Enums and Types
export type ProjectStatus = 
  | 'planning' 
  | 'in-progress' 
  | 'on-hold' 
  | 'completed' 
  | 'cancelled' 
  | 'review';

export type ProjectPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'critical' 
  | 'urgent';

export type ProjectCategory = 
  | 'web-development' 
  | 'mobile-app' 
  | 'design' 
  | 'marketing' 
  | 'research' 
  | 'maintenance' 
  | 'infrastructure' 
  | 'testing' 
  | 'documentation' 
  | 'other';

export type TaskStatus = 
  | 'todo' 
  | 'in-progress' 
  | 'in-review' 
  | 'completed' 
  | 'cancelled' 
  | 'blocked' 
  | 'on-hold';

export type TaskPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'critical' 
  | 'urgent';

export type TaskCategory = 
  | 'development' 
  | 'design' 
  | 'testing' 
  | 'documentation' 
  | 'review' 
  | 'deployment' 
  | 'bug-fix' 
  | 'feature' 
  | 'research' 
  | 'meeting';

export type TeamRole = 
  | 'project-manager' 
  | 'developer' 
  | 'designer' 
  | 'tester' 
  | 'analyst' 
  | 'client' 
  | 'observer' 
  | 'contributor';

export type TeamPermission = 
  | 'view-project' 
  | 'edit-project' 
  | 'delete-project' 
  | 'manage-team' 
  | 'create-tasks' 
  | 'edit-tasks' 
  | 'delete-tasks' 
  | 'assign-tasks' 
  | 'comment' 
  | 'upload-files' 
  | 'track-time' 
  | 'view-reports';

export type CommentType = 
  | 'project-comment' 
  | 'task-comment' 
  | 'general' 
  | 'feedback' 
  | 'question' 
  | 'announcement';

export type TimeEntryStatus = 
  | 'draft' 
  | 'submitted' 
  | 'approved' 
  | 'rejected';

export type ActivityType = 
  | 'project-created' 
  | 'project-updated' 
  | 'project-completed' 
  | 'task-created' 
  | 'task-updated' 
  | 'task-assigned' 
  | 'task-completed' 
  | 'member-added' 
  | 'member-removed' 
  | 'comment-added' 
  | 'file-uploaded' 
  | 'milestone-created' 
  | 'milestone-completed' 
  | 'time-logged';

export type EntityType = 
  | 'project' 
  | 'task' 
  | 'comment' 
  | 'team-member' 
  | 'milestone' 
  | 'time-entry';

export type MilestoneStatus = 
  | 'pending' 
  | 'in-progress' 
  | 'completed' 
  | 'overdue' 
  | 'cancelled';

// Request/Response Interfaces
export interface IProjectCreateRequest {
  name: string;
  description: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  projectManager?: string;
  startDate: Date;
  endDate: Date;
  estimatedHours: number;
  budget?: number;
  category: ProjectCategory;
  tags?: string[];
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
  templateId?: string;
}

export interface IProjectUpdateRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  projectManager?: string;
  startDate?: Date;
  endDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  budget?: number;
  actualCost?: number;
  progress?: number;
  category?: ProjectCategory;
  tags?: string[];
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
  filesToDelete?: string[];
}

export interface ITaskCreateRequest {
  projectId: string;
  title: string;
  description: string;
  priority?: TaskPriority;
  assignedTo?: string;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours: number;
  category?: TaskCategory;
  tags?: string[];
  parentTaskId?: string;
  dependencies?: string[];
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
  checklist?: Omit<ITaskChecklistItem, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[];
}

export interface ITaskUpdateRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  category?: TaskCategory;
  tags?: string[];
  dependencies?: string[];
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
  checklist?: Omit<ITaskChecklistItem, 'taskId' | 'createdAt' | 'updatedAt'>[];
  filesToDelete?: string[];
}

export interface ITeamMemberAddRequest {
  employeeId: string;
  role: TeamRole;
  permissions: TeamPermission[];
  hourlyRate?: number;
}

export interface ITeamMemberUpdateRequest {
  role?: TeamRole;
  permissions?: TeamPermission[];
  hourlyRate?: number;
  isActive?: boolean;
}

export interface ICommentCreateRequest {
  projectId?: string;
  taskId?: string;
  commentType: CommentType;
  content: string;
  parentCommentId?: string;
  mentions?: string[];
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
}

export interface ICommentUpdateRequest {
  content: string;
  mentions?: string[];
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
  filesToDelete?: string[];
}

export interface ITimeEntryCreateRequest {
  projectId: string;
  taskId?: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  isBillable: boolean;
}

export interface ITimeEntryUpdateRequest {
  description?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  isBillable?: boolean;
  status?: TimeEntryStatus;
}

export interface IMilestoneCreateRequest {
  projectId: string;
  title: string;
  description: string;
  dueDate: Date;
  tasks?: string[];
}

export interface IMilestoneUpdateRequest {
  title?: string;
  description?: string;
  dueDate?: Date;
  status?: MilestoneStatus;
  tasks?: string[];
  completedAt?: Date;
}

// Response Interfaces
export interface IProjectApiResponse<T = unknown> extends IApiResponse<T> {
  data?: T;
}

export interface IProjectWithDetails extends IProject {
  teamMembers: ITeamMember[];
  tasks: ITask[];
  milestones: IMilestone[];
  recentActivity: IProjectActivity[];
  totalTimeSpent: number;
  completedTasks: number;
  totalTasks: number;
}

export interface ITaskWithDetails extends ITask {
  assignedToDetails?: ITeamMember;
  subtasks?: ITask[];
  comments: IComment[];
  timeEntries: ITimeEntry[];
  dependentTasks?: ITask[];
}

// Dashboard and Analytics Interfaces
export interface IProjectDashboard {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalTimeLogged: number;
  recentActivity: IProjectActivity[];
  upcomingDeadlines: Array<{
    type: 'project' | 'task' | 'milestone';
    id: string;
    title: string;
    dueDate: Date;
    status: string;
  }>;
}

export interface IProjectStatistics {
  projectsByStatus: Record<ProjectStatus, number>;
  projectsByCategory: Record<ProjectCategory, number>;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  averageProjectDuration: number;
  averageTaskCompletionTime: number;
  mostActiveUsers: Array<{
    userId: string;
    userName: string;
    activitiesCount: number;
    timeLogged: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    projectsCompleted: number;
    tasksCompleted: number;
    hoursLogged: number;
  }>;
}

// Filter and Search Interfaces
export interface IProjectFilter {
  status?: ProjectStatus[];
  priority?: ProjectPriority[];
  category?: ProjectCategory[];
  createdBy?: string;
  projectManager?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  isArchived?: boolean;
}

export interface ITaskFilter {
  projectId?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedTo?: string;
  createdBy?: string;
  category?: TaskCategory[];
  startDate?: Date;
  dueDate?: Date;
  tags?: string[];
  isOverdue?: boolean;
}

export interface IProjectSearch {
  query: string;
  filters?: IProjectFilter;
  sortBy?: 'name' | 'createdAt' | 'startDate' | 'endDate' | 'priority' | 'progress';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ITaskSearch {
  query: string;
  filters?: ITaskFilter;
  sortBy?: 'title' | 'createdAt' | 'dueDate' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Utility Types
export type ProjectProgress = {
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  percentageComplete: number;
  estimatedCompletion: Date;
};

export type TaskDependency = {
  taskId: string;
  dependsOn: string[];
  blockedBy: string[];
};

export type ProjectCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'project' | 'task' | 'milestone';
  status: string;
  priority: string;
  assignee?: string;
};

export type ProjectReport = {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
  budgetUsed: number;
  teamSize: number;
  completionRate: number;
  averageTaskDuration: number;
  overdueItems: number;
};

// NextAuth module declarations
declare module "next-auth" {
  interface Session {
    user: ISessionUser;
    activeProjects?: IProject[];
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: 'employee';
    emailVerified: boolean;
    activeProjects?: IProject[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: 'employee';
    emailVerified: boolean;
    activeProjects?: IProject[];
  }
}