import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Check admin access for /admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    try {
      // First check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.log('Middleware: No authenticated user for admin route')
        return NextResponse.redirect(new URL('/', req.url))
      }

      // Check if user has admin role in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // Handle profile lookup errors
      if (profileError) {
        // Check for common error cases
        const isProfileNotFound = profileError.code === 'PGRST116' ||
                                 profileError.message?.includes('No rows found') ||
                                 profileError.code === 'PGRST204' ||
                                 !profileError.code // Empty error object

        if (isProfileNotFound) {
          console.log('Middleware: User profile not found - redirecting')
          return NextResponse.redirect(new URL('/', req.url))
        } else {
          // Log actual database errors but still deny access
          console.error('Middleware: Error fetching profile:', profileError)
          return NextResponse.redirect(new URL('/', req.url))
        }
      }

      // Check if user has admin role
      if (profile?.role !== 'admin') {
        console.log('Middleware: User does not have admin role - redirecting')
        return NextResponse.redirect(new URL('/', req.url))
      }

      // User is authenticated and has admin role - allow access
      console.log('Middleware: Admin access granted for user:', user.id)

    } catch (error) {
      console.error('Middleware: Unexpected error during admin check:', error)
      // On any unexpected error, deny access
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}
