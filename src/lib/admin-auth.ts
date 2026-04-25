import { NextRequest, NextResponse } from 'next/server';
import { createSecureResponse, logSecurityEvent } from './security';
import { createServerSupabaseClient } from './supabase-server';

async function checkAdminAccess(): Promise<{
  isAdmin: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { isAdmin: false, error: 'Please sign in to continue.' };
    }

    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      return { isAdmin: false, error: 'Unable to verify admin access.' };
    }

    return { isAdmin: userData?.role === 'admin', user };
  } catch {
    return { isAdmin: false, error: 'Unable to verify admin access.' };
  }
}

// Wrapper for admin API routes
export function withAdminAuth(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Check admin access
      const adminCheck = await checkAdminAccess();

      if (!adminCheck.isAdmin) {
        logSecurityEvent('unauthorized_admin_access_attempt', {
          path: request.nextUrl.pathname,
          method: request.method,
          error: adminCheck.error,
        }, request);

        return createSecureResponse(
          { error: adminCheck.error || 'Admin access required' },
          { status: 403 }
        );
      }

      // Log successful admin access
      logSecurityEvent('admin_access_granted', {
        path: request.nextUrl.pathname,
        method: request.method,
        userId: adminCheck.user?.id,
      }, request);

      // Call the original handler
      return await handler(request, context);
    } catch (error) {
      logSecurityEvent('admin_route_error', {
        path: request.nextUrl.pathname,
        method: request.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, request);

      return createSecureResponse(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Helper to create admin-only responses
export function createAdminResponse(
  data: any,
  options: ResponseInit = {}
): NextResponse {
  return createSecureResponse(data, options);
}
