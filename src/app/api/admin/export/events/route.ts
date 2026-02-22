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
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    // Build query using TABLES constant
    let query = supabase
      .from(TABLES.EVENTS)
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