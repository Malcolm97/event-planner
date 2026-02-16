import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { getUserFriendlyError } from '@/lib/userMessages';

// Public endpoint for fetching creator profiles
// This endpoint is accessible without authentication and returns only public user information
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const fields = searchParams.get('fields');

    // Only fetch public fields - no sensitive information
    const publicFields = 'id, name, email, phone, company, about, photo_url, role, updated_at, created_at';
    const selectedFields = fields || publicFields;

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
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
        query = query.limit(limitNum);
      }
    } else {
      // Default limit for performance
      query = query.limit(50);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching creators from Supabase:', error.message);
      return NextResponse.json(
        { error: getUserFriendlyError(error, 'Failed to fetch creators') },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Unexpected error fetching creators:', error.message);
    return NextResponse.json(
      { error: getUserFriendlyError(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
