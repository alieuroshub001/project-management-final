// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define route patterns and their required roles
const PROTECTED_ROUTES = {
  // Dashboard routes - role-based access
  '/dashboard/admin': ['admin'],
  '/dashboard/hr': ['admin', 'hr'],
  '/dashboard/employee': ['admin', 'hr', 'employee'],
  
  // API routes - role-based access
  '/api/admin': ['admin'],
  '/api/hr': ['admin', 'hr'],
  '/api/employee': ['admin', 'hr', 'employee'],
  
  // General dashboard - all authenticated users
  '/dashboard': ['admin', 'hr', 'employee'],
} as const;

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/verify-otp',
  '/api/auth/signup',
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/auth/nextauth',
  '/api/auth/session',
  '/api/auth/providers',
  '/api/auth/csrf',
  '/api/auth/callback',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/error',
] as const;

// Routes that should redirect authenticated users away
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
] as const;

// Helper function to check if a path matches a pattern
function matchesPattern(path: string, pattern: string): boolean {
  if (pattern === path) return true;
  
  // Handle wildcard patterns (e.g., '/api/admin' should match '/api/admin/users')
  if (pattern.endsWith('*')) {
    const basePattern = pattern.slice(0, -1);
    return path.startsWith(basePattern);
  }
  
  // Handle exact prefix matching
  if (path.startsWith(pattern + '/') || path === pattern) {
    return true;
  }
  
  return false;
}

// Helper function to check if user has required role
function hasRequiredRole(userRole: string, requiredRoles: readonly string[]): boolean {
  return requiredRoles.includes(userRole);
}

// Helper function to get the appropriate dashboard redirect based on user role
function getDashboardRedirect(role: string): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'hr':
      return '/dashboard/hr';
    case 'employee':
      return '/dashboard/employee';
    default:
      return '/dashboard';
  }
}

// Helper function to check if route is public
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    matchesPattern(pathname, route) || 
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  );
}

// Helper function to check if route is an auth route
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => matchesPattern(pathname, route));
}

// Helper function to get required roles for a protected route
function getRequiredRoles(pathname: string): readonly string[] | null {
  for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (matchesPattern(pathname, route)) {
      return roles;
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  try {
    // Get the token from NextAuth
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Handle public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Handle auth routes (login, signup, etc.) - redirect authenticated users
    if (isAuthRoute(pathname)) {
      if (token?.role) {
        // User is authenticated, redirect to appropriate dashboard
        const dashboardUrl = new URL(getDashboardRedirect(token.role), request.url);
        return NextResponse.redirect(dashboardUrl);
      }
      return NextResponse.next();
    }

    // Handle protected routes
    const requiredRoles = getRequiredRoles(pathname);
    
    if (requiredRoles) {
      // Route requires authentication
      if (!token) {
        // Not authenticated, redirect to login
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check if user has required role
      if (!hasRequiredRole(token.role as string, requiredRoles)) {
        // User doesn't have required role, redirect to their appropriate dashboard
        const dashboardUrl = new URL(getDashboardRedirect(token.role as string), request.url);
        return NextResponse.redirect(dashboardUrl);
      }

      // Check additional authentication requirements
      if (!token.isApproved) {
        // User is not approved by admin
        const pendingUrl = new URL('/auth/pending-approval', request.url);
        return NextResponse.redirect(pendingUrl);
      }

      if (!token.accountActivated) {
        // User hasn't activated account with employee ID
        const activationUrl = new URL('/auth/activate-account', request.url);
        return NextResponse.redirect(activationUrl);
      }

      // User is authenticated and authorized
      return NextResponse.next();
    }

    // For any other routes, check if user is authenticated
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
      if (!token) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Additional checks for authenticated users
      if (!token.isApproved) {
        const pendingUrl = new URL('/auth/pending-approval', request.url);
        return NextResponse.redirect(pendingUrl);
      }

      if (!token.accountActivated) {
        const activationUrl = new URL('/auth/activate-account', request.url);
        return NextResponse.redirect(activationUrl);
      }
    }

    return NextResponse.next();

  } catch (error) {
    console.error('Middleware error:', error);
    
    // On error, redirect to login for protected routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (NextAuth API routes)
     * 2. /_next/* (Next.js internals)
     * 3. /_static/* (static files)
     * 4. /favicon.ico, /robots.txt, etc. (static files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json).*)',
  ],
};