import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET || 'fallback_secret_for_development_only_123!';
const encodedKey = new TextEncoder().encode(secretKey);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Paths that require ADMIN role
  const adminPaths = ['/dashboard', '/calendar', '/crm', '/staff', '/marketing'];
  
  // Paths that require CUSTOMER role (or any logged in user)
  const customerPaths = ['/', '/booking', '/profile', '/rewards', '/store', '/try-on'];

  // Paths that require STAFF role
  const staffPaths = ['/staff-portal'];

  const isAdminPath = adminPaths.some(p => pathname.startsWith(p));
  const isCustomerPath = customerPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isStaffPath = staffPaths.some(p => pathname.startsWith(p));

  // If it's a public path like login or API, let it through
  if (pathname.startsWith('/login') || pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // 1. Get the session cookie
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    // Not logged in -> Redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 2. Verify and decode the JWT
    const { payload } = await jwtVerify(sessionCookie, encodedKey, {
      algorithms: ['HS256'],
    });

    // 3. Enforce Role Security
    if (isAdminPath && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (isStaffPath && payload.role !== 'staff' && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 4. Success -> Allow access
    return NextResponse.next();
  } catch (error) {
    // Invalid or expired token -> Redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
