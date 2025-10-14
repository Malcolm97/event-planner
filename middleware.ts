import { NextRequest, NextResponse } from 'next/server';
import { middleware as apiMiddleware } from '@/lib/middleware';

export { apiMiddleware as middleware };

// Re-export config from the lib middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (handled above)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
