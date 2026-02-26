import { createServerSupabaseClient } from './supabase-server'
import { TABLES } from './supabase'
import { NextResponse } from 'next/server'

/**
 * Result of admin access check
 */
export interface AdminCheckResult {
  isAdmin: boolean;
  error?: string;
  user?: { id: string; email?: string };
}

/**
 * Check if the current user has admin privileges
 * Uses server-side Supabase client for secure authentication
 */
export async function checkAdminAccess(): Promise<AdminCheckResult> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { isAdmin: false, error: 'Not authenticated' }
    }

    // Check if user has admin role in profiles table
    const { data: userData, error: userError } = await supabase
      .from(TABLES.PROFILES)
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError) {
      const isUserNotFound = userError.code === 'PGRST116' ||
                             userError.message?.includes('No rows found') ||
                             userError.code === 'PGRST204' ||
                             !userError.code

      if (isUserNotFound) {
        return { isAdmin: false, error: 'Profile not found. Please try signing in again.' }
      }
      return { isAdmin: false, error: 'Failed to verify permissions. Please try again.' }
    }

    return { 
      isAdmin: userData?.role === 'admin', 
      user: { id: user.id, email: user.email }
    }
  } catch (error) {
    console.error('Admin access check error:', error)
    return { isAdmin: false, error: 'Something unexpected happened. Please try again.' }
  }
}

/**
 * Middleware-like function to require admin access for API routes
 * Returns null if admin access is granted, or a NextResponse error if not
 */
export async function requireAdminAccess(): Promise<NextResponse | null> {
  const adminCheck = await checkAdminAccess()
  
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { error: adminCheck.error || 'Access denied. Admin privileges required.' },
      { status: 403 }
    )
  }
  
  return null // No error, admin access granted
}

/**
 * Get Supabase server client for admin data fetching
 * Use this with requireAdminAccess() for protected routes
 */
export async function getAdminClient() {
  return await createServerSupabaseClient()
}

/**
 * Add standard caching headers for admin API responses
 * Admin data changes frequently, so use short cache times
 */
export function addAdminCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  response.headers.set('X-Content-Source', 'admin-api')
  return response
}