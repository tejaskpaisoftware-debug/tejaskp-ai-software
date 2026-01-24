import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Helper to check for protected routes
// We want to protect /dashboard and all sub-routes
const isProtectedRoute = (path: string) => path.startsWith('/dashboard');

// Paths that logged-in users shouldn't access (like login page)
const isPublicAuthRoute = (path: string) => path === '/login' || path === '/register';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // 1. CACHE CONTROL
    // We want to prevent caching for protected pages AND auth pages
    const response = NextResponse.next();

    if (isProtectedRoute(path) || isPublicAuthRoute(path)) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        response.headers.set('Surrogate-Control', 'no-store');
    }

    // 2. AUTHENTICATION CHECK
    // We only run this logic if it's a protected route OR auth route
    if (!isProtectedRoute(path) && !isPublicAuthRoute(path)) {
        return response;
    }

    const token = request.cookies.get('auth_token')?.value;
    let isValid = false;
    let payload = null;

    if (token) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-this');
            const { payload: jwtPayload } = await jwtVerify(token, secret);
            isValid = true;
            payload = jwtPayload;
        } catch (err) {
            // Token invalid or expired
            isValid = false;
        }
    }

    // 3. REDIRECT LOGIC
    // NOTE: With Header-Based Auth (sessionStorage), Middleware cannot verify tokens on page navigation.
    // We rely on client-side AuthGuard for page protection and API route protection for data.

    // FORCE LOGOUT Check: If user goes to /login?logout=true, allow it and clear cookie
    if (path === '/login' && request.nextUrl.searchParams.get('logout')) {
        const response = NextResponse.next();
        response.cookies.delete('auth_token');
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        return response;
    }

    // Skipped: Case A (Protected Route) - Handled by Client AuthGuard
    // Skipped: Case B (Auth Route) - Handled by Client AuthGuard


    // Case B: User IS logged in but tries to access LOGIN page
    // (Handled by client-side redirect if needed)
    /*
    if (isPublicAuthRoute(path) && isValid) {
       // ... existing logic ...
    }
    */


    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
};
