import { NextRequest, NextResponse } from 'next/server';
import { supabase } from './supabase';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMITS = {
  // General API limits
  api: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes

  // Admin routes - stricter limits
  admin: { maxRequests: 50, windowMs: 15 * 60 * 1000 }, // 50 requests per 15 minutes

  // Authentication routes
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 requests per 15 minutes

  // File upload limits
  upload: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 uploads per hour
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
    // Reset or initialize
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

// Check admin access
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      const isProfileNotFound = profileError.code === 'PGRST116' ||
                               profileError.message?.includes('No rows found') ||
                               profileError.code === 'PGRST204' ||
                               !profileError.code;

      if (isProfileNotFound) {
        return { isAdmin: false, error: 'Profile not found' };
      } else {
        return { isAdmin: false, error: 'Database error' };
      }
    }

    return { isAdmin: profile?.role === 'admin', user };
  } catch (error) {
    return { isAdmin: false, error: 'Unexpected error' };
  }
}

// Validate API key (for future use)
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) return true; // No API key required in development
  if (!apiKey) return false;

  return apiKey === validApiKey;
}

// Sanitize input more thoroughly
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .slice(0, 10000); // Reasonable length limit
}

// Check for suspicious patterns (basic bot detection)
export function isSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /python/i, // Often used for scraping
    /curl/i,
    /wget/i,
  ];

  // Allow legitimate bots
  const allowedBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i, // Yahoo
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
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

  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Log security events (in production, send to monitoring service)
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
