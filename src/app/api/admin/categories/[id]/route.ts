import { NextResponse } from "next/server"
import { TABLES } from "@/lib/supabase"
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
    
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: getUserFriendlyError(error, "Failed to fetch category") },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ data })
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
    const { name, description } = await req.json()
    const { id } = await params
    
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .update({ name, description })
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json(
        { error: getUserFriendlyError(error, "Failed to update category") },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: data?.[0], success: true })
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
    
    const { error } = await supabase
      .from(TABLES.CATEGORIES)
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: getUserFriendlyError(error, "Failed to delete category") },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: getUserFriendlyError(error, "Internal server error") },
      { status: 500 }
    )
  }
}
