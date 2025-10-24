import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { approved, role } = await req.json()
  const { id } = await params
  const { data, error } = await supabase
    .from('profiles')
    .update({ approved, role })
    .eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ data, success: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ success: true })
}
