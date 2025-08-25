// lib/auth.ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IOTP, ISessionUser } from '@/types/employee';
import { sendOTPEmail } from './email';
import NextAuth, { SessionStrategy, User as NextAuthUser, Session, Account, Profile, AuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { AdapterUser } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import User from '@/models/employee/User';
import connectToDatabase from './db';

// Extended user type for NextAuth - must match your types
interface ExtendedUser extends NextAuthUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'employee'; // Specific type, not string
  emailVerified: boolean;
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
  type: IOTP['type']
): Promise<string> {
  const OTP = (await import('@/models/employee/OTP')).default;
  const otp = generateOTP();
 
  await OTP.findOneAndUpdate(
    { email, type },
    { otp, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    { upsert: true, new: true }
  );
  // Send OTP via email
  await sendOTPEmail(email, otp, type);
 
  return otp;
}

export async function verifyOTP(
  email: string,
  otp: string,
  type: IOTP['type']
): Promise<boolean> {
  const OTP = (await import('@/models/employee/OTP')).default;
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

// NextAuth Configuration
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
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
          mobile: user.mobile,
          role: user.role as 'employee',
          emailVerified: user.emailVerified
        } as ExtendedUser;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.name = extendedUser.name;
        token.email = extendedUser.email;
        token.mobile = extendedUser.mobile;
        token.role = extendedUser.role;
        token.emailVerified = extendedUser.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      const sessionUser: ISessionUser = {
        id: token.id as string,
        name: token.name as string,
        email: token.email as string,
        mobile: token.mobile as string,
        role: token.role as 'employee',
        emailVerified: token.emailVerified as boolean
      };

      session.user = sessionUser;
      return session;
    }
  },
  pages: {
    signIn: '/auth/employee/login',
    error: '/auth/employee/login',
    verifyRequest: '/auth/employee/login'
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt' as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
};

// Export the NextAuth handler
export default NextAuth(authOptions);