// src/middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const authRoutes = ['/employee/auth/login', '/employee/auth/signup', '/employee/auth/forgot-password'];
const protectedRoutes = ['/employee', '/employee/dashboard', '/api/employee'];
const nextAuthApiRoutes = ['/employee/auth/:path*'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthRoute = authRoutes.some(route => path.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isNextAuthApi = nextAuthApiRoutes.some(route => 
    path.match(new RegExp(route.replace(':path*', '.*')))
  );

  // Always allow NextAuth API routes
  if (isNextAuthApi) {
    return NextResponse.next();
  }

  // Skip middleware for public API routes (excluding protected ones)
  if (path.startsWith('/api') && !isProtectedRoute) {
    return NextResponse.next();
  }

  const token = await getToken({ 
    req: request,
    // Specify the custom base path for token retrieval
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/employee/dashboard', request.url));
  }

  // Protect routes that require authentication
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/employee/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/employee/:path*',
    '/employee/dashboard/:path*',
    '/api/employee/:path*',
    '/employee/auth/login',
    '/employee/auth/signup',
    '/employee/auth/forgot-password',
    '/api/employee/auth/:path*' // Add your custom NextAuth API routes
  ],
};