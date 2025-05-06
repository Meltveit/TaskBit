import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.has('__session');
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  
  // If the user is on an auth page and is already authenticated,
  // redirect to dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If the user is trying to access a protected route and is not authenticated,
  // redirect to login page
  if (!isAuthenticated && isProtectedRoute(request.nextUrl.pathname)) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

// Define which routes should be protected
function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = [
    '/dashboard',
    '/projects',
    '/invoices',
    '/time-tracking',
    '/clients',
    '/settings',
  ];
  
  return protectedPaths.some(path => pathname.startsWith(path));
}

export const config = {
  matcher: [
    // Match all routes except for api routes, static files, etc.
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};