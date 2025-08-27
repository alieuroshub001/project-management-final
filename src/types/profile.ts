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

// Employee Profile Interface
export interface IEmployeeProfile {
  id: string;
  employeeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  email: string;
  mobile: string;
  dateOfJoining?: Date;
  dateOfBirth?: Date;
  designation?: string;
  department?: string;
  reportingManager?: string;
  reportingManagerName?: string;
  workLocation?: string;
  employmentType: EmploymentType;
  bio?: string;
  skills?: string[];
  languages?: ILanguageProficiency[];
  education?: IEducation[];
  experience?: IWorkExperience[];
  certifications?: ICertification[];
  socialLinks?: ISocialLink[];
  emergencyContacts?: IEmergencyContact[];
  profileImage?: ICloudinaryFile;
  coverImage?: ICloudinaryFile;
  resume?: ICloudinaryFile;
  isProfileComplete: boolean;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

// Language Proficiency Interface
export interface ILanguageProficiency {
  language: string;
  proficiency: LanguageProficiencyLevel;
  isPrimary: boolean;
}

// Education Interface
export interface IEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  grade?: string;
  description?: string;
  attachments?: ICloudinaryFile[];
}

// Work Experience Interface
export interface IWorkExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description?: string;
  skillsUsed?: string[];
  achievements?: string[];
  attachments?: ICloudinaryFile[];
}

// Certification Interface
export interface ICertification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expirationDate?: Date;
  doesNotExpire: boolean;
  credentialId?: string;
  credentialUrl?: string;
  attachments?: ICloudinaryFile[];
}

// Social Link Interface
export interface ISocialLink {
  platform: SocialPlatform;
  url: string;
  isPublic: boolean;
}

// Emergency Contact Interface
export interface IEmergencyContact {
  id: string;
  name: string;
  relationship: string;
  mobile: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
}

// Password Management Interface
export interface IPasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IPasswordReset {
  email: string;
  mobile: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

// Account Deletion Interface
export interface IAccountDeletionRequest {
  reason: string;
  feedback?: string;
  password: string;
}

// Profile Completion Status
export interface IProfileCompletion {
  totalSteps: number;
  completedSteps: number;
  completionPercentage: number;
  pendingSections: ProfileSection[];
  lastUpdated: Date;
}

// Enums and Types
export type EmploymentType = 
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'internship'
  | 'freelance'
  | 'temporary';

export type LanguageProficiencyLevel = 
  | 'beginner'
  | 'elementary'
  | 'intermediate'
  | 'advanced'
  | 'native';

export type SocialPlatform = 
  | 'linkedin'
  | 'twitter'
  | 'github'
  | 'gitlab'
  | 'facebook'
  | 'instagram'
  | 'behance'
  | 'dribbble'
  | 'portfolio'
  | 'website'
  | 'other';

export type ProfileSection = 
  | 'personal'
  | 'contact'
  | 'professional'
  | 'education'
  | 'experience'
  | 'skills'
  | 'certifications'
  | 'social'
  | 'emergency'
  | 'documents';

export type ProfileVisibility = 
  | 'public'
  | 'team'
  | 'manager'
  | 'private';

// Request Interfaces
export interface IProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  dateOfJoining?: Date;
  dateOfBirth?: Date;
  designation?: string;
  department?: string;
  bio?: string;
  skills?: string[];
  workLocation?: string;
  employmentType?: EmploymentType;
}

export interface IContactUpdateRequest {
  mobile?: string;
  emergencyContacts?: Omit<IEmergencyContact, 'id'>[];
}

export interface IEducationUpdateRequest {
  education: Omit<IEducation, 'id' | 'attachments'>[];
  filesToUpload?: File[];
  filesToDelete?: string[];
}

export interface IExperienceUpdateRequest {
  experience: Omit<IWorkExperience, 'id' | 'attachments'>[];
  filesToUpload?: File[];
  filesToDelete?: string[];
}

export interface ICertificationUpdateRequest {
  certifications: Omit<ICertification, 'id' | 'attachments'>[];
  filesToUpload?: File[];
  filesToDelete?: string[];
}

export interface ISocialLinksUpdateRequest {
  socialLinks: ISocialLink[];
}

export interface IProfileImageUpdateRequest {
  profileImage: File;
  removeCurrent?: boolean;
}

export interface ICoverImageUpdateRequest {
  coverImage: File;
  removeCurrent?: boolean;
}

export interface IResumeUploadRequest {
  resume: File;
  removeCurrent?: boolean;
}

// Response Interfaces
export interface IProfileApiResponse<T = unknown> extends IApiResponse<T> {
  data?: T;
}

export interface IProfileWithDetails extends IEmployeeProfile {
  reportingManagerDetails?: IEmployeeProfile;
  teamMembers?: IEmployeeProfile[];
  leaveBalance?: number;
  upcomingBirthdays?: IEmployeeProfile[];
  workAnniversary?: Date;
  yearsOfService?: number;
}

export interface IProfileCompletionResponse {
  completion: IProfileCompletion;
  suggestions: string[];
  mandatoryFields: string[];
}

// Validation Interfaces
export interface IProfileValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  missingRequired: string[];
}

// Dashboard Interfaces
export interface IProfileDashboard {
  profile: IEmployeeProfile;
  completion: IProfileCompletion;
  recentUpdates: IProfileActivity[];
  teamUpdates: IProfileActivity[];
  birthdaysThisMonth: IEmployeeProfile[];
  workAnniversariesThisMonth: IEmployeeProfile[];
}

export interface IProfileActivity {
  id: string;
  employeeId: string;
  employeeName: string;
  activityType: ProfileActivityType;
  section: ProfileSection;
  description: string;
  timestamp: Date;
}

// Export Interface
export interface IProfileExport {
  format: 'pdf' | 'docx' | 'json';
  include: ProfileSection[];
  password?: string;
}

// Enums for Activities
export type ProfileActivityType = 
  | 'profile-created'
  | 'profile-updated'
  | 'education-added'
  | 'education-updated'
  | 'experience-added'
  | 'experience-updated'
  | 'certification-added'
  | 'certification-updated'
  | 'skill-added'
  | 'social-link-added'
  | 'emergency-contact-added'
  | 'profile-image-changed'
  | 'resume-uploaded'
  | 'password-changed'
  | 'account-settings-updated';

// NextAuth module declarations
declare module "next-auth" {
  interface Session {
    user: ISessionUser;
    profile?: IEmployeeProfile;
    profileCompletion?: IProfileCompletion;
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: 'employee';
    emailVerified: boolean;
    profile?: IEmployeeProfile;
    profileCompletion?: IProfileCompletion;
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
    profile?: IEmployeeProfile;
    profileCompletion?: IProfileCompletion;
  }
}

// Utility Types
export type ProfileStats = {
  totalEmployees: number;
  profilesCompleted: number;
  averageCompletion: number;
  departments: Record<string, number>;
  designations: Record<string, number>;
  employmentTypes: Record<EmploymentType, number>;
};

export type ProfileSearchFilter = {
  query?: string;
  departments?: string[];
  designations?: string[];
  skills?: string[];
  employmentTypes?: EmploymentType[];
  location?: string;
  hasProfileImage?: boolean;
  isProfileComplete?: boolean;
  sortBy?: 'name' | 'department' | 'dateOfJoining' | 'completionPercentage';
  sortOrder?: 'asc' | 'desc';
};

export type TeamDirectory = {
  department: string;
  employees: IEmployeeProfile[];
  count: number;
};