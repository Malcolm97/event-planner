import { NextResponse } from "next/server"
import { TABLES, USER_FIELDS } from "@/lib/supabase"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-utils"
import { getUserFriendlyError } from "@/lib/userMessages"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Check admin access using server-side client
  const adminCheck = await checkAdminAccess()
  
  if (!adminCheck.isAdmin || !adminCheck.supabase) {
    return unauthorizedResponse(adminCheck.error)
  }

  const supabase = adminCheck.supabase

  try {
    const { id } = await params

    const { data: event, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: getUserFriendlyError(error, "Failed to fetch event") },
        { status: 500 }
      )
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Fetch creator info separately using correct field names
    let creatorInfo = null
    if (event.created_by) {
      const { data: creator } = await supabase
        .from(TABLES.PROFILES)
        .select(`${USER_FIELDS.ID}, ${USER_FIELDS.FULL_NAME}, ${USER_FIELDS.AVATAR_URL}`)
        .eq('id', event.created_by)
        .single()
      
      if (creator) {
        creatorInfo = {
          id: creator.id,
          full_name: creator.full_name,
          avatar_url: creator.avatar_url
        }
      }
    }

    return NextResponse.json({ 
      data: {
        ...event,
        creator: creatorInfo
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Check admin access using server-side client
  const adminCheck = await checkAdminAccess()
  
  if (!adminCheck.isAdmin || !adminCheck.supabase) {
    return unauthorizedResponse(adminCheck.error)
  }

  const supabase = adminCheck.supabase

  try {
    const { id } = await params
    const body = await req.json()
    const { approved, featured, title, description, category, location, venue, date, end_date } = body

    // Build update object with only provided fields
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (approved !== undefined) updateData.approved = approved
    if (featured !== undefined) updateData.featured = featured
    if (title !== undefined) updateData.name = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (location !== undefined) updateData.location = location
    if (venue !== undefined) updateData.venue = venue
    if (date !== undefined) updateData.date = date
    if (end_date !== undefined) updateData.end_date = end_date

    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json(
        { error: getUserFriendlyError(error, "Failed to update event") },
        { status: 400 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ data: data[0], success: true })
  } catch (error) {
    return NextResponse.json(
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Check admin access using server-side client
  const adminCheck = await checkAdminAccess()
  
  if (!adminCheck.isAdmin || !adminCheck.supabase) {
    return unauthorizedResponse(adminCheck.error)
  }

  const supabase = adminCheck.supabase

  try {
    const { id } = await params

    // Check if event exists
    const { data: existingEvent, error: fetchError } = await supabase
      .from(TABLES.EVENTS)
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Delete saved events first (foreign key constraint)
    await supabase
      .from(TABLES.SAVED_EVENTS)
      .delete()
      .eq('event_id', id)

    // Delete the event
    const { error } = await supabase
      .from(TABLES.EVENTS)
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: getUserFriendlyError(error, "Failed to delete event") },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: "Event deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}
