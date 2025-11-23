import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Admin routes are now publicly accessible - no middleware authentication checks
  // API routes will handle their own authentication
  if (req.nextUrl.pathname.startsWith('/admin')) {
    console.log('Middleware: Allowing public access to admin routes')
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}
