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
import connectToDatabase from './db';

// Extended user type for NextAuth
interface ExtendedUser extends NextAuthUser {
  id: string;
  role: string;
}

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
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

// OTP utilities
export function generateOTP(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

export async function createOTPRecord(
  email: string,
  type: IOTP['type'],
  role: string
): Promise<string> {
  const OTP = (await import('@/models/OTP')).default;
  const otp = generateOTP();
  
  // Get the actual recipient email based on role
  let recipientEmail = email;
  if (role === 'admin') {
    recipientEmail = process.env.ADMIN_EMAIL || email;
  }
 
  await OTP.findOneAndUpdate(
    { email, type },
    { otp, role, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    { upsert: true, new: true }
  );
  
  // Send OTP via email to the appropriate recipient
  await sendOTPEmail(recipientEmail, otp, type, role);
 
  return otp;
}

export async function verifyOTP(
  email: string,
  otp: string,
  type: IOTP['type']
): Promise<boolean> {
  const OTP = (await import('@/models/OTP')).default;
  const record = await OTP.findOne({ email, otp, type });
 
  if (!record || record.expiresAt < new Date()) {
    return false;
  }
 
  await OTP.deleteOne({ id: record.id });
  return true;
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

// Email validation utility
export function validateEmailForRole(email: string, role: string): { isValid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (role === 'hr' || role === 'employee') {
    const requiredDomain = 'euroshub@gmail.com';
    if (!email.endsWith(requiredDomain)) {
      return { 
        isValid: false, 
        error: `Email must end with ${requiredDomain} for ${role} role` 
      };
    }
  }

  return { isValid: true };
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
       
        const isValid = await verifyPassword(
          credentials?.password || '',
          user.password
        );
        if (!isValid) throw new Error('Incorrect password');
       
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt(params: JwtCallbackParams) {
      const { token, user } = params;
      if (user && 'role' in user) {
        token.id = user.id;
        token.role = (user as ExtendedUser).role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
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