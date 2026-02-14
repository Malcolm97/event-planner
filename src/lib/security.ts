import { NextRequest, NextResponse } from 'next/server';
import { supabase } from './supabase';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMITS = {
  api: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
  admin: { maxRequests: 50, windowMs: 15 * 60 * 1000 },
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 },
  upload: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
};

// Security headers
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.vercel.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://*.vercel.com wss://*.supabase.co",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

// Check rate limit
export function checkRateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS = 'api'
): { allowed: boolean; resetTime?: number; remaining?: number } {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') ||
             'unknown';
  const key = `${type}:${ip}`;
  const now = Date.now();
  const limit = RATE_LIMITS[type];

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.windowMs,
    });
    return { allowed: true, resetTime: now + limit.windowMs, remaining: limit.maxRequests - 1 };
  }

  if (current.count >= limit.maxRequests) {
    return { allowed: false, resetTime: current.resetTime, remaining: 0 };
  }

  current.count++;
  return {
    allowed: true,
    resetTime: current.resetTime,
    remaining: limit.maxRequests - current.count
  };
}

// Check admin access - uses 'users' table
export async function checkAdminAccess(request?: NextRequest): Promise<{
  isAdmin: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { isAdmin: false, error: 'Not authenticated' };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      const isUserNotFound = userError.code === 'PGRST116' ||
                               userError.message?.includes('No rows found') ||
                               userError.code === 'PGRST204' ||
                               !userError.code;

      if (isUserNotFound) {
        return { isAdmin: false, error: 'User profile not found' };
      } else {
        return { isAdmin: false, error: 'Database error' };
      }
    }

    return { isAdmin: userData?.role === 'admin', user };
  } catch (error) {
    return { isAdmin: false, error: 'Unexpected error' };
  }
}

// Validate API key
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) return true;
  if (!apiKey) return false;

  return apiKey === validApiKey;
}

// Sanitize input
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .slice(0, 10000);
}

// Check for suspicious patterns
export function isSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i, /python/i, /curl/i, /wget/i,
  ];

  const allowedBots = [
    /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i, /baiduspider/i, /yandexbot/i,
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  const isAllowed = allowedBots.some(pattern => pattern.test(userAgent));

  return isSuspicious && !isAllowed;
}

// Create security-enhanced response
export function createSecureResponse(
  data: any,
  options: ResponseInit = {}
): NextResponse {
  const response = NextResponse.json(data, options);

  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Log security events
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  request?: NextRequest
): void {
  const logData = {
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: request?.headers.get('x-forwarded-for') ||
        request?.headers.get('x-real-ip') ||
        request?.headers.get('cf-connecting-ip') ||
        'unknown',
    userAgent: request?.headers.get('user-agent'),
  };

  console.warn('[SECURITY]', JSON.stringify(logData, null, 2));
}
