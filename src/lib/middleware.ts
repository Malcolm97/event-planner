import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMITS = {
  // General API rate limit
  api: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes

  // Auth endpoints
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 requests per 15 minutes

  // File upload endpoints
  upload: { windowMs: 60 * 60 * 1000, maxRequests: 20 }, // 20 uploads per hour

  // Push notification endpoints
  push: { windowMs: 60 * 60 * 1000, maxRequests: 50 }, // 50 notifications per hour
};

// Clean up expired rate limit entries
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Check rate limit
function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupRateLimitStore();

  const limit = RATE_LIMITS[limitType];
  const key = `${limitType}:${identifier}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + limit.windowMs };
    rateLimitStore.set(key, entry);
  }

  const remaining = Math.max(0, limit.maxRequests - entry.count);

  if (entry.count >= limit.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: remaining - 1, resetTime: entry.resetTime };
}

// Get client identifier (IP address)
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  // Use the first available IP, fallback to a default
  const ip = forwarded?.split(',')[0]?.trim() ||
             realIp ||
             cfConnectingIp ||
             'unknown';

  return ip;
}

// Validate request content type
function validateContentType(request: NextRequest, allowedTypes: string[]): boolean {
  const contentType = request.headers.get('content-type') || '';
  return allowedTypes.some(type => contentType.includes(type));
}

// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate request size
function validateRequestSize(request: NextRequest, maxSizeBytes: number): boolean {
  const contentLength = parseInt(request.headers.get('content-length') || '0');
  return contentLength <= maxSizeBytes;
}

// Main middleware function
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const clientId = getClientIdentifier(request);

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // API routes middleware
  if (pathname.startsWith('/api/')) {
    // Rate limiting
    let limitType: keyof typeof RATE_LIMITS = 'api';

    if (pathname.includes('/auth/') || pathname.includes('/users/')) {
      limitType = 'auth';
    } else if (pathname.includes('/upload') || pathname.includes('/image')) {
      limitType = 'upload';
    } else if (pathname.includes('/push')) {
      limitType = 'push';
    }

    const rateLimit = checkRateLimit(clientId, limitType);

    if (!rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          },
        }
      );
    }

    // Content type validation for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const allowedTypes = ['application/json'];

      // Allow multipart/form-data for upload endpoints
      if (pathname.includes('/upload') || pathname.includes('/image')) {
        allowedTypes.push('multipart/form-data');
      }

      if (!validateContentType(request, allowedTypes)) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid content type' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Request size validation (10MB limit for uploads, 1MB for others)
      const maxSize = pathname.includes('/upload') || pathname.includes('/image')
        ? 10 * 1024 * 1024 // 10MB
        : 1 * 1024 * 1024; // 1MB

      if (!validateRequestSize(request, maxSize)) {
        return new NextResponse(
          JSON.stringify({ error: 'Request too large' }),
          {
            status: 413,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());

    return response;
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

// Export configuration
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
