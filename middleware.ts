import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import {
  checkRateLimit,
  isSuspiciousRequest,
  logSecurityEvent,
  SECURITY_HEADERS
} from '@/lib/security'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Add security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // Check for suspicious requests
  if (isSuspiciousRequest(req)) {
    logSecurityEvent('suspicious_request_detected', {
      path: req.nextUrl.pathname,
      method: req.method,
    }, req);

    // Block suspicious requests
    return new NextResponse('Access Denied', {
      status: 403,
      headers: res.headers
    });
  }

  // Rate limiting for admin routes
  if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api/admin')) {
    const rateLimitResult = checkRateLimit(req, 'admin');

    if (!rateLimitResult.allowed) {
      logSecurityEvent('rate_limit_exceeded', {
        path: req.nextUrl.pathname,
        limit: 50,
        windowMs: 15 * 60 * 1000,
      }, req);

      const retryAfter = Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000);

      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          ...res.headers,
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime!.toString(),
        }
      });
    }

    // Add rate limit headers
    res.headers.set('X-RateLimit-Limit', '50');
    res.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining!.toString());
    res.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime!.toString());
  }

  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResult = checkRateLimit(req, 'api');

    if (!rateLimitResult.allowed) {
      logSecurityEvent('api_rate_limit_exceeded', {
        path: req.nextUrl.pathname,
        limit: 100,
        windowMs: 15 * 60 * 1000,
      }, req);

      const retryAfter = Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000);

      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          ...res.headers,
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime!.toString(),
        }
      });
    }
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
  ],
}
