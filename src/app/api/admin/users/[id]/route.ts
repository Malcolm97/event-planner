import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getUserFriendlyError } from "@/lib/userMessages"
import { logUserAction } from "@/lib/auditLogger"

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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Check admin access
  const adminCheck = await checkAdminAccess()
  
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { error: adminCheck.error || 'Access denied. Admin privileges required.' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params

    const { data: profile, error } = await supabase
      .from('profiles')
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

    return NextResponse.json({ data: profile })
  } catch (error) {
    return NextResponse.json(
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Check admin access
  const adminCheck = await checkAdminAccess()
  
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { error: adminCheck.error || 'Access denied. Admin privileges required.' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { approved, role, full_name, email } = body

    // Build update object with only provided fields
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (approved !== undefined) updateData.approved = approved
    if (role !== undefined) updateData.role = role
    if (full_name !== undefined) updateData.full_name = full_name
    if (email !== undefined) updateData.email = email

    const { data, error } = await supabase
      .from('profiles')
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

    return NextResponse.json({ data: data[0], success: true })
  } catch (error) {
    return NextResponse.json(
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Check admin access
  const adminCheck = await checkAdminAccess()
  
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { error: adminCheck.error || 'Access denied. Admin privileges required.' },
      { status: 403 }
    )
  }

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
      .from('profiles')
      .select('id, role')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete the profile (this will cascade to auth.users if set up properly)
    const { error } = await supabase
      .from('profiles')
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