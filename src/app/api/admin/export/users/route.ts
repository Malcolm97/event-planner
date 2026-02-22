import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Helper function to check admin access
async function checkAdminAccess() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { isAdmin: false, error: 'Not authenticated' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { isAdmin: false, error: 'Profile not found' }
    }

    return { isAdmin: profile.role === 'admin', user }
  } catch (error) {
    return { isAdmin: false, error: 'Unexpected error' }
  }
}

export async function GET(request: Request) {
  const adminCheck = await checkAdminAccess()
  
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { error: adminCheck.error || 'Access denied. Admin privileges required.' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('profiles')
      .select('*')

    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    if (status === 'approved') {
      query = query.eq('approved', true)
    } else if (status === 'pending') {
      query = query.eq('approved', false)
    }

    const { data: users, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users to export' }, { status: 400 })
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(users, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }

    // CSV format
    const headers = ['ID', 'Full Name', 'Email', 'Role', 'Approved', 'Created At']
    const csvRows = [headers.join(',')]

    for (const user of users) {
      const row = [
        user.id || '',
        `"${(user.full_name || '').replace(/"/g, '""')}"`,
        `"${(user.email || '').replace(/"/g, '""')}"`,
        user.role || 'user',
        user.approved ? 'Yes' : 'No',
        user.updated_at || '',
      ]
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}