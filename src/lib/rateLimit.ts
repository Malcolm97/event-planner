import { supabase } from './supabase';

// Rate limit configuration
const RATE_LIMITS = {
  api: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
  admin: { maxRequests: 50, windowMs: 15 * 60 * 1000 },
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 },
  upload: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  push: { maxRequests: 50, windowMs: 60 * 60 * 1000 },
} as const;

// In-memory cache for rate limiting (with TTL for serverless)
// This serves as a quick cache but can be reset on serverless function cold starts
// For production, consider using Redis or Supabase
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60 * 1000; // Clean every minute

function cleanupCache() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, data] of rateLimitCache.entries()) {
      if (now > data.resetTime) {
        rateLimitCache.delete(key);
      }
    }
    lastCleanup = now;
  }
}

export function checkRateLimit(
  ip: string,
  type: keyof typeof RATE_LIMITS = 'api'
): { allowed: boolean; resetTime?: number; remaining?: number } {
  cleanupCache();

  const key = `${type}:${ip}`;
  const now = Date.now();
  const limit = RATE_LIMITS[type];

  const current = rateLimitCache.get(key);

  if (!current || now > current.resetTime) {
    rateLimitCache.set(key, {
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

// Database-backed rate limiting for persistent storage
// This can be used if you want rate limits to persist across serverless instances
export async function checkRateLimitDatabase(
  ip: string,
  type: keyof typeof RATE_LIMITS = 'api'
): Promise<{ allowed: boolean; resetTime?: number; remaining?: number }> {
  try {
    const key = `${type}:${ip}`;
    const now = Date.now();
    const limit = RATE_LIMITS[type];
    const windowStart = new Date(now - limit.windowMs).toISOString();

    // Try to get existing rate limit record
    const { data: existing, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('key', key)
      .gte('reset_time', now)
      .single();

    if (error || !existing) {
      // No record or expired - create new one
      const resetTime = now + limit.windowMs;
      
      await supabase
        .from('rate_limits')
        .upsert({
          key,
          count: 1,
          reset_time: new Date(resetTime).toISOString(),
          created_at: new Date().toISOString()
        }, { onConflict: 'key' });

      return { allowed: true, resetTime, remaining: limit.maxRequests - 1 };
    }

    // Check if limit exceeded
    if (existing.count >= limit.maxRequests) {
      return { allowed: false, resetTime: new Date(existing.reset_time).getTime(), remaining: 0 };
    }

    // Increment count
    await supabase
      .from('rate_limits')
      .update({ count: existing.count + 1 })
      .eq('key', key);

    const resetTime = new Date(existing.reset_time).getTime();
    return {
      allowed: true,
      resetTime,
      remaining: limit.maxRequests - existing.count - 1
    };
  } catch (error) {
    // Fallback to in-memory if database fails
    console.warn('Database rate limit failed, falling back to in-memory:', error);
    return checkRateLimit(ip, type);
  }
}

// Cleanup old rate limit records from database
export async function cleanupRateLimitDatabase() {
  try {
    const now = new Date().toISOString();
    await supabase
      .from('rate_limits')
      .delete()
      .lt('reset_time', now);
  } catch (error) {
    console.warn('Failed to cleanup rate limit database:', error);
  }
}

// Export rate limit types for use in routes
export type RateLimitType = keyof typeof RATE_LIMITS;
