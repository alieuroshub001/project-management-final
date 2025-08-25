import { IApiResponse, ISessionUser } from ".";

export interface ILeave {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeMobile: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewComments?: string;
  emergencyContact?: string;
  handoverNotes?: string;
  attachments?: ICloudinaryFile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  annualLeave: number;
  sickLeave: number;
  casualLeave: number;
  maternityLeave?: number;
  paternityLeave?: number;
  unpaidLeave: number;
  compensatoryLeave?: number;
  bereavementLeave?: number;
  sabbaticalLeave?: number;
  halfDayLeave?: number;
  shortLeave?: number;
  usedAnnualLeave: number;
  usedSickLeave: number;
  usedCasualLeave: number;
  usedMaternityLeave?: number;
  usedPaternityLeave?: number;
  usedUnpaidLeave: number;
  usedCompensatoryLeave?: number;
  usedBereavementLeave?: number;
  usedSabbaticalLeave?: number;
  usedHalfDayLeave?: number;
  usedShortLeave?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeavePolicy {
  id: string;
  policyName: string;
  description: string;
  leaveTypes: LeaveType[];
  maxConsecutiveDays: number;
  minNoticePeriod: number;
  maxLeavesPerYear: number;
  carryForward: boolean;
  maxCarryForwardDays: number;
  requiresApproval: boolean;
  approvalWorkflow: ApprovalWorkflow[];
  documentationRequired: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeaveHistory {
  id: string;
  employeeId: string;
  leaveId: string;
  action: LeaveAction;
  performedBy: string;
  performedByName: string;
  comments?: string;
  timestamp: Date;
  previousStatus?: LeaveStatus;
  newStatus: LeaveStatus;
}

export interface ILeaveApproval {
  id: string;
  leaveId: string;
  approverId: string;
  approverName: string;
  approverEmail: string;
  level: number;
  status: ApprovalStatus;
  comments?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type LeaveType = 
  | 'annual' 
  | 'sick' 
  | 'casual' 
  | 'maternity' 
  | 'paternity' 
  | 'unpaid' 
  | 'compensatory' 
  | 'bereavement' 
  | 'sabbatical'
  | 'half-day'
  | 'short-leave'
  | 'time-off-in-lieu'
  | 'jury-duty'
  | 'volunteer'
  | 'religious';

export type LeaveStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'cancelled' 
  | 'in-review' 
  | 'awaiting-documents';

export type ApprovalStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'delegated';

export type LeaveAction = 
  | 'apply' 
  | 'approve' 
  | 'reject' 
  | 'cancel' 
  | 'request-changes' 
  | 'update' 
  | 'add-documents'
  | 'upload-attachments'
  | 'delete-attachments';

export type ApprovalWorkflow = {
  level: number;
  approverRole: string;
  approverId?: string;
  isMandatory: boolean;
};

export interface ILeaveSummary {
  totalLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  remainingBalance: ILeaveBalance;
  upcomingLeaves: ILeave[];
}

export interface ILeaveCreateRequest {
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  emergencyContact?: string;
  handoverNotes?: string;
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
}

export interface ILeaveUpdateRequest {
  leaveType?: LeaveType;
  startDate?: Date;
  endDate?: Date;
  reason?: string;
  emergencyContact?: string;
  handoverNotes?: string;
  attachments?: File[];
  cloudinaryAttachments?: ICloudinaryFile[];
  filesToDelete?: string[];
}

export interface ILeaveReviewRequest {
  status: LeaveStatus;
  comments: string;
}

export interface ILeaveApiResponse<T = unknown> extends IApiResponse<T> {
  data?: T;
}

export interface ILeaveStatistics {
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
  averageProcessingTime: number;
  mostCommonLeaveType: LeaveType;
  peakLeaveMonths: string[];
}

export interface ILeaveCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  employeeName: string;
  leaveType: LeaveType;
  status: LeaveStatus;
  allDay: boolean;
}

export interface ILeaveQuota {
  leaveType: LeaveType;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  expiresAt?: Date;
}

export interface ILeaveValidation {
  isOverlapping: boolean;
  hasSufficientBalance: boolean;
  meetsNoticePeriod: boolean;
  isWithinMaxConsecutiveDays: boolean;
  isValidLeaveType: boolean;
}

// Cloudinary File Interfaces
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

// NextAuth module declarations
declare module "next-auth" {
  interface Session {
    user: ISessionUser;
    leaveBalance?: ILeaveBalance;
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: 'employee';
    emailVerified: boolean;
    leaveBalance?: ILeaveBalance;
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
    leaveBalance?: ILeaveBalance;
  }
}

// Utility types
export type LeaveDuration = {
  startDate: Date;
  endDate: Date;
  totalDays: number;
  isHalfDay?: boolean;
  halfDayPeriod?: 'first-half' | 'second-half';
};

export type LeaveFilter = {
  status?: LeaveStatus[];
  leaveType?: LeaveType[];
  startDate?: Date;
  endDate?: Date;
  employeeId?: string;
};

export type LeaveReport = {
  employeeId: string;
  employeeName: string;
  totalLeavesTaken: number;
  leavesByType: Record<LeaveType, number>;
  averageLeaveDuration: number;
  mostFrequentLeaveType: LeaveType;
};