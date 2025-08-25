export interface IUser {
  id: string;
  name: string;
  email: string;
  mobile: string; // Added mobile number field
  role: 'employee'; // Removed other roles, only employee remains
  emailVerified: boolean;
  verificationToken?: string; 
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithPassword extends IUser {
  password: string;
  confirmPassword: string; // Added confirm password field
}

export interface ISessionUser {
  id: string;
  name: string;
  email: string;
  mobile: string; // Added mobile number field
  role: 'employee'; // Updated to only employee role
  emailVerified: boolean; // ADD THIS LINE - This was missing!
}

export interface ISession {
  user: ISessionUser;
  expires: string;
}

export interface IOTP {
  id: string;
  email: string;
  mobile: string; // Added mobile number field for OTP
  otp: string;
  type: 'verification' | 'password-reset';
  expiresAt: Date;
  createdAt: Date;
}

export interface IPasswordResetToken {
  id: string;
  email: string;
  mobile: string; // Added mobile number field
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

// NextAuth module declarations to ensure proper typing
declare module "next-auth" {
  interface Session {
    user: ISessionUser;
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: 'employee';
    emailVerified: boolean;
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
  }
}