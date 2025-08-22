// src/middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password'];
const protectedRoutes = ['/admin', '/dashboard', '/api/user'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthRoute = authRoutes.some(route => path.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  // Skip middleware for public API routes
  if (path.startsWith('/api') && !isProtectedRoute) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect routes that require authentication
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/user/:path*',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password'
  ],
};