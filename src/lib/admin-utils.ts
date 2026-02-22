import { createServerSupabaseClient } from './supabase-server'
import { getUserFriendlyError } from './userMessages'

/**
 * Shared admin access check for API routes
 * Uses server-side Supabase client to properly access session cookies
 */
export async function checkAdminAccess(): Promise<{
  isAdmin: boolean
  user?: { id: string; email?: string }
  error?: string
  supabase?: Awaited<ReturnType<typeof createServerSupabaseClient>>
}> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { isAdmin: false, error: 'Not authenticated' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, id, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      const isProfileNotFound = profileError.code === 'PGRST116' ||
                               profileError.message?.includes('No rows found') ||
                               profileError.code === 'PGRST204' ||
                               !profileError.code

      if (isProfileNotFound) {
        return { isAdmin: false, error: 'Profile not found' }
      } else {
        return { isAdmin: false, error: getUserFriendlyError(profileError, 'Something went wrong. Please try again.') }
      }
    }

    return { 
      isAdmin: profile?.role === 'admin', 
      user: { id: user.id, email: user.email },
      supabase 
    }
  } catch (error) {
    return { isAdmin: false, error: getUserFriendlyError(error, 'Something unexpected happened. Please try again.') }
  }
}

/**
 * Standard unauthorized response for admin routes
 */
export function unauthorizedResponse(error: string = 'Access denied. Admin privileges required.') {
  return Response.json(
    { error },
    { status: 403 }
  )
}