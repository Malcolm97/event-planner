import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    environment: {
      status: 'ok' | 'error';
      supabaseConfigured: boolean;
      missingVars?: string[];
    };
  };
}

// Track server start time for uptime calculation
const serverStartTime = Date.now();

export async function GET() {
  const healthStatus: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    checks: {
      database: {
        status: 'ok'
      },
      environment: {
        status: 'ok',
        supabaseConfigured: false
      }
    }
  };

  // Check environment configuration
  const missingVars: string[] = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  healthStatus.checks.environment.supabaseConfigured = isSupabaseConfigured();
  
  if (missingVars.length > 0) {
    healthStatus.checks.environment.status = 'error';
    healthStatus.checks.environment.missingVars = missingVars;
    healthStatus.status = 'degraded';
  }

  // Check database connectivity
  if (isSupabaseConfigured()) {
    try {
      const startTime = Date.now();
      
      // Simple query to test database connection
      const { error } = await supabase
        .from('events')
        .select('id')
        .limit(1);
      
      const latency = Date.now() - startTime;
      healthStatus.checks.database.latency = latency;
      
      if (error) {
        // Don't treat RLS errors as database failures
        if (error.message?.includes('row-level security') || error.code === '42501') {
          healthStatus.checks.database.status = 'ok';
          healthStatus.checks.database.latency = latency;
        } else {
          healthStatus.checks.database.status = 'error';
          healthStatus.checks.database.error = error.message;
          healthStatus.status = 'degraded';
        }
      } else {
        healthStatus.checks.database.status = 'ok';
      }
    } catch (error: any) {
      healthStatus.checks.database.status = 'error';
      healthStatus.checks.database.error = error.message || 'Unknown database error';
      healthStatus.status = 'error';
    }
  } else {
    healthStatus.checks.database.status = 'error';
    healthStatus.checks.database.error = 'Supabase not configured';
    healthStatus.status = 'degraded';
  }

  // Set appropriate HTTP status based on health
  const httpStatus = healthStatus.status === 'error' ? 503 : 200;
  
  const response = NextResponse.json(healthStatus, { status: httpStatus });
  
  // Don't cache health checks
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('X-Health-Status', healthStatus.status);
  
  return response;
}

export async function HEAD() {
  // Quick health check without detailed response
  const isHealthy = isSupabaseConfigured();
  return new Response(null, { 
    status: isHealthy ? 200 : 503,
    headers: {
      'X-Health-Status': isHealthy ? 'ok' : 'degraded'
    }
  });
}