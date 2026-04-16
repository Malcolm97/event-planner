import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  checkRateLimit,
  isSuspiciousRequest,
  logSecurityEvent,
  SECURITY_HEADERS
} from '@/lib/security'

const DEV_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']

function getAllowedOrigins() {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL
  const origins = new Set<string>()

  if (configuredOrigin) {
    origins.add(configuredOrigin)
  }

  if (process.env.NODE_ENV !== 'production') {
    DEV_ALLOWED_ORIGINS.forEach(origin => origins.add(origin))
  }

  return origins
}

function applyCorsHeaders(req: NextRequest, res: NextResponse) {
  const allowedOrigins = getAllowedOrigins()
  const origin = req.headers.get('origin')

  if (origin && allowedOrigins.has(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin)
  } else if (!origin && process.env.NEXT_PUBLIC_APP_URL) {
    res.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL)
  }

  res.headers.set('Vary', 'Origin')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')
}

function isMutatingMethod(method: string) {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/')

  if (isApiRoute) {
    applyCorsHeaders(req, res)

    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: res.headers })
    }

    const requestOrigin = req.headers.get('origin')
    const allowedOrigins = getAllowedOrigins()
    if (requestOrigin && isMutatingMethod(req.method) && !allowedOrigins.has(requestOrigin)) {
      return new NextResponse('Forbidden origin', { status: 403, headers: res.headers })
    }
  }

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
