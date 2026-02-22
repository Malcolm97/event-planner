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
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    // Build query
    let query = supabase
      .from('events')
      .select('*')

    if (status === 'approved') {
      query = query.eq('approved', true)
    } else if (status === 'pending') {
      query = query.eq('approved', false)
    } else if (status === 'featured') {
      query = query.eq('featured', true)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: events, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ error: 'No events to export' }, { status: 400 })
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(events, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="events-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }

    // CSV format
    const headers = ['ID', 'Name', 'Category', 'Location', 'Venue', 'Date', 'End Date', 'Approved', 'Featured', 'Created At']
    const csvRows = [headers.join(',')]

    for (const event of events) {
      const row = [
        event.id || '',
        `"${(event.name || '').replace(/"/g, '""')}"`,
        `"${(event.category || '').replace(/"/g, '""')}"`,
        `"${(event.location || '').replace(/"/g, '""')}"`,
        `"${(event.venue || '').replace(/"/g, '""')}"`,
        event.date || '',
        event.end_date || '',
        event.approved ? 'Yes' : 'No',
        event.featured ? 'Yes' : 'No',
        event.created_at || '',
      ]
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="events-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}