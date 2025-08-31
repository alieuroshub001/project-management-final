import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const AUTH_ROUTES = [
  '/auth/employee/login',
  '/auth/employee/signup',
  '/auth/employee/forgot-password'
] as const;

const PROTECTED_ROUTES = [
  '/employee',
  '/employee/dashboard',
  '/api'
] as const;

const NEXTAUTH_API_PATTERN = /^\/auth\/.*/;
const DEFAULT_DASHBOARD_URL = '/employee/dashboard';
const DEFAULT_LOGIN_URL = '/auth/employee/login';

type RouteType = 'auth' | 'protected' | 'nextauth-api' | 'public-api' | 'other';

function getRouteType(path: string): RouteType {
  if (NEXTAUTH_API_PATTERN.test(path)) {
    return 'nextauth-api';
  }
  
  if (AUTH_ROUTES.some(route => path.startsWith(route))) {
    return 'auth';
  }
  
  if (PROTECTED_ROUTES.some(route => path.startsWith(route))) {
    return 'protected';
  }
  
  if (path.startsWith('/api')) {
    return 'public-api';
  }
  
  return 'other';
}

function createRedirectResponse(url: string, request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL(url, request.url));
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const routeType = getRouteType(path);

  if (routeType === 'nextauth-api' || routeType === 'public-api' || routeType === 'other') {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (routeType === 'auth' && token) {
    return createRedirectResponse(DEFAULT_DASHBOARD_URL, request);
  }

  if (routeType === 'protected' && !token) {
    return createRedirectResponse(DEFAULT_LOGIN_URL, request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/employee/:path*',
    '/employee/dashboard/:path*',
    '/api/:path*',
    '/auth/employee/login',
    '/auth/employee/signup',
    '/auth/employee/forgot-password',
    '/api/auth/:path*' // Add your custom NextAuth API routes
  ],
};