import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    let query = supabase
      .from(TABLES.USERS)
      .select('id, name, email, phone, company, about, photo_url, updated_at')
      .order('updated_at', { ascending: false });

    // Apply limit if provided
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching users from Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Unexpected error fetching users:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
