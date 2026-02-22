import { NextResponse } from "next/server"
import { TABLES } from "@/lib/supabase"
import { checkAdminAccess, unauthorizedResponse } from "@/lib/admin-utils"
import { getUserFriendlyError } from "@/lib/userMessages"
import { normalizeUser } from "@/lib/types"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Check admin access using server-side client
  const adminCheck = await checkAdminAccess()
  
  if (!adminCheck.isAdmin || !adminCheck.supabase) {
    return unauthorizedResponse(adminCheck.error)
  }

  const supabase = adminCheck.supabase

  try {
    const { id } = await params

    const { data: profile, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: getUserFriendlyError(error, "Failed to fetch user") },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Normalize the user data for backward compatibility
    const normalizedProfile = normalizeUser(profile)

    return NextResponse.json({ data: normalizedProfile })
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
    const { approved, role, full_name, name, email } = body

    // Build update object with only provided fields
    // Use full_name for database (name is an alias)
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (approved !== undefined) updateData.approved = approved
    if (role !== undefined) updateData.role = role
    if (full_name !== undefined) updateData.full_name = full_name
    else if (name !== undefined) updateData.full_name = name // Support 'name' as alias
    if (email !== undefined) updateData.email = email

    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json(
        { error: getUserFriendlyError(error, "Failed to update user") },
        { status: 400 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Normalize the response
    const normalizedData = normalizeUser(data[0])

    return NextResponse.json({ data: normalizedData, success: true })
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

    // Prevent deleting yourself
    if (adminCheck.user?.id === id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from(TABLES.PROFILES)
      .select('id, role')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete the profile (this will cascade to auth.users if set up properly)
    const { error } = await supabase
      .from(TABLES.PROFILES)
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: getUserFriendlyError(error, "Failed to delete user") },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}
