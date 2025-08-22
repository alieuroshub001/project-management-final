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
  role: 'admin' | 'superadmin';
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
        token.role = extendedUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      const sessionUser: ISessionUser = {
        id: token.id as string,
        name: token.name as string,
        email: token.email as string,
        role: token.role as 'admin' | 'superadmin'
      };

      session.user = sessionUser;
      return session;
    }
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login'
  },
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
