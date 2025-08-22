// types/index.ts
export interface IUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
  emailVerified: boolean;
  verificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithPassword extends IUser {
  password: string;
}

export interface ISessionUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
}

export interface ISession {
  user: ISessionUser;
  expires: string;
}

export interface IOTP {
  id: string;
  email: string;
  otp: string;
  type: 'verification' | 'password-reset';
  role: 'admin' | 'hr' | 'employee';
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

export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}