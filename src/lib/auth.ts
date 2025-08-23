// lib/auth.ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IOTP } from '@/types';
import { sendOTPEmail } from './email';
import NextAuth, { SessionStrategy, User as NextAuthUser, Session, Account, Profile } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { AdapterUser } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import User from '@/models/User';
import OTP from '@/models/OTP';
import connectToDatabase from './db';

// Extended user type for NextAuth
interface ExtendedUser extends NextAuthUser {
  id: string;
  role: string;
  employeeId?: string;
  isApproved: boolean;
  accountActivated: boolean;
}

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      employeeId?: string;
      isApproved: boolean;
      accountActivated: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    employeeId?: string;
    isApproved: boolean;
    accountActivated: boolean;
  }
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// OTP utilities - Updated to use the OTP model's static methods
export function generateOTP(length = 6): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOTPRecord(
  userEmail: string,
  userRole: string,
  type: IOTP['type']
): Promise<{ otp: string; recipientEmail: string }> {
  await connectToDatabase();
  
  // Use the OTP model's static method
  return await OTP.createOTP(userEmail, userRole, type);
}

export async function verifyOTP(
  userEmail: string,
  otp: string,
  type: IOTP['type']
): Promise<boolean> {
  await connectToDatabase();
  
  // Use the OTP model's static method
  return await OTP.verifyOTP(userEmail, otp, type);
}

// Token utilities
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

interface JwtCallbackParams {
  token: JWT;
  user?: NextAuthUser | AdapterUser;
  account?: Account | null;
  profile?: Profile;
  trigger?: "signIn" | "signUp" | "update";
  isNewUser?: boolean;
  session?: Session;
}

// NextAuth Configuration
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        await connectToDatabase();
       
        const user = await User.findOne({ email: credentials?.email }).select('+password');
        if (!user) throw new Error('No user found with this email');
       
        if (!user.emailVerified) {
          throw new Error('Please verify your email first');
        }

        // Check if user is approved (admin is auto-approved)
        if (!user.isApproved) {
          throw new Error('Your account is pending admin approval');
        }

        // Check if account is activated (admin is auto-activated)
        if (!user.accountActivated) {
          throw new Error('Please activate your account with your employee ID');
        }
       
        const isValid = await verifyPassword(
          credentials?.password || '',
          user.password
        );
        if (!isValid) throw new Error('Incorrect password');
       
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          isApproved: user.isApproved,
          accountActivated: user.accountActivated
        };
      }
    })
  ],
  callbacks: {
    async jwt(params: JwtCallbackParams) {
      const { token, user } = params;
      if (user && 'role' in user) {
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.role = extendedUser.role;
        token.employeeId = extendedUser.employeeId;
        token.isApproved = extendedUser.isApproved;
        token.accountActivated = extendedUser.accountActivated;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.employeeId = token.employeeId;
        session.user.isApproved = token.isApproved;
        session.user.accountActivated = token.accountActivated;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
    verifyRequest: '/auth/login'
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt' as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
};

// Export the NextAuth handler
export default NextAuth(authOptions);