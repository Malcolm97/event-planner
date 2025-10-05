import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user from Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Unexpected error fetching user:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
