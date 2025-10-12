import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const fields = searchParams.get('fields');

    // Define default fields for performance - only fetch what's needed
    const defaultFields = 'id, name, email, phone, company, about, photo_url, updated_at';
    const selectedFields = fields || defaultFields;

    let query = supabase
      .from(TABLES.USERS)
      .select(selectedFields)
      .order('updated_at', { ascending: false });

    // Apply pagination
    if (offset) {
      const offsetNum = parseInt(offset, 10);
      if (!isNaN(offsetNum) && offsetNum >= 0) {
        query = query.range(offsetNum, offsetNum + (limit ? parseInt(limit, 10) : 50) - 1);
      }
    } else if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) { // Max 100 items per request
        query = query.limit(limitNum);
      }
    } else {
      // Default limit for performance
      query = query.limit(50);
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
