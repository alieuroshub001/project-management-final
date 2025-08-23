import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectToDatabase from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import User from '@/models/User';
import { ISessionUser } from '@/types';

interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
  employeeId?: string;
  isApproved: boolean;
  accountActivated: boolean;
}

// Type augmentation for NextAuth to include our custom fields
declare module 'next-auth' {
  interface Session {
    user: ISessionUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'hr' | 'employee';
    employeeId?: string;
    isApproved: boolean;
    accountActivated: boolean;
  }
}

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          await connectToDatabase();

          const user = await User.findOne({ email: credentials?.email }).select('+password');
          if (!user) {
            throw new Error('No user found with this email');
          }

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
          if (!isValid) {
            throw new Error('Incorrect password');
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            isApproved: user.isApproved,
            accountActivated: user.accountActivated
          } as ExtendedUser;
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.name = extendedUser.name;
        token.email = extendedUser.email;
        token.role = extendedUser.role;
        token.employeeId = extendedUser.employeeId;
        token.isApproved = extendedUser.isApproved;
        token.accountActivated = extendedUser.accountActivated;
      }

      // Handle session updates (useful for profile updates)
      if (trigger === 'update' && session) {
        // Refresh user data from database
        try {
          await connectToDatabase();
          const updatedUser = await User.findById(token.id);
          if (updatedUser) {
            token.name = updatedUser.name;
            token.email = updatedUser.email;
            token.role = updatedUser.role;
            token.employeeId = updatedUser.employeeId;
            token.isApproved = updatedUser.isApproved;
            token.accountActivated = updatedUser.accountActivated;
          }
        } catch (error) {
          console.error('Error updating token:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      const sessionUser: ISessionUser = {
        id: token.id,
        name: token.name,
        email: token.email,
        role: token.role,
        employeeId: token.employeeId,
        isApproved: token.isApproved,
        accountActivated: token.accountActivated
      };

      session.user = sessionUser;
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
    verifyRequest: '/auth/verify-email'
  },
  events: {
    async signOut({ token }) {
      // Optional: Log signout events
      console.log('User signed out:', token.email);
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };