import { NextResponse } from "next/server"
import { TABLES } from "@/lib/supabase"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-utils"

export async function GET(request: Request) {
  // Check admin access using server-side client
  const adminCheck = await checkAdminAccess()
  
  if (!adminCheck.isAdmin || !adminCheck.supabase) {
    return unauthorizedResponse(adminCheck.error)
  }

  const supabase = adminCheck.supabase

  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    // Build query using TABLES constant
    let query = supabase
      .from(TABLES.PROFILES)
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

    // CSV format - use correct field names (full_name, avatar_url)
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
