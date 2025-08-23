// types/index.ts
// Updated types with new user roles and approval system
export interface IUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
  emailVerified: boolean;
  mobileNumber: string;
  employeeId?: string; // Optional for admin, required for hr/employee after approval
  isApproved: boolean; // Admin approval status
  approvedBy?: string; // Admin ID who approved
  approvedAt?: Date; // Approval timestamp
  accountActivated: boolean; // Whether user has activated account with employee ID
  verificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithPassword extends IUser {
  password: string;
  confirmPassword?: string; // Used during signup validation
}

// Auth session types
export interface ISessionUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
  employeeId?: string;
  isApproved: boolean;
  accountActivated: boolean;
}

export interface ISession {
  user: ISessionUser;
  expires: string;
}

// OTP and password reset types
export interface IOTP {
  id: string;
  email: string;
  otp: string;
  type: 'verification' | 'password-reset';
  expiresAt: Date;
  createdAt: Date;
}

export interface IPasswordResetToken {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Admin approval system types
export interface IPendingApproval {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: 'hr' | 'employee';
  mobileNumber: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'declined';
  reviewedBy?: string; // Admin ID
  reviewedAt?: Date;
  employeeIdAssigned?: string;
}

// Signup form types
export interface ISignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'hr' | 'employee';
  mobileNumber: string;
  employeeId?: string; // Only for admin signup
}

// Account activation types
export interface IAccountActivation {
  email: string;
  employeeId: string;
  password: string;
}

// API response types
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Email validation types
export interface IEmailValidation {
  isValid: boolean;
  isDomainRestricted: boolean; // For hr/employee emails
  requiredDomain?: string;
}

// Employee ID assignment types
export interface IEmployeeIdAssignment {
  userId: string;
  employeeId: string;
  assignedBy: string; // Admin ID
  assignedAt: Date;
}