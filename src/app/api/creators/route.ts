import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { TABLES, USER_FIELDS } from '@/lib/supabase';
import { getUserFriendlyError } from '@/lib/userMessages';
import { normalizeUser } from '@/lib/types';

// Public endpoint for fetching creator profiles
// This endpoint is accessible without authentication and returns only public user information
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const search = searchParams.get('search');

    // Use server-side client for better security and SSR compatibility
    const supabase = await createServerSupabaseClient();

    // Build query for profiles table using correct field names
    // Database uses 'full_name' and 'avatar_url', not 'name' and 'photo_url'
    let query = supabase
      .from(TABLES.PROFILES)
      .select(`
        ${USER_FIELDS.ID},
        ${USER_FIELDS.FULL_NAME},
        ${USER_FIELDS.EMAIL},
        ${USER_FIELDS.PHONE},
        ${USER_FIELDS.COMPANY},
        ${USER_FIELDS.ABOUT},
        ${USER_FIELDS.AVATAR_URL},
        ${USER_FIELDS.ROLE},
        ${USER_FIELDS.UPDATED_AT}
      `, { count: 'exact' })
      .order(USER_FIELDS.UPDATED_AT, { ascending: false });

    // Apply search filter if provided
    if (search && search.trim().length > 0) {
      const searchPattern = `%${search.trim()}%`;
      query = query.or(`${USER_FIELDS.FULL_NAME}.ilike.${searchPattern},${USER_FIELDS.EMAIL}.ilike.${searchPattern},${USER_FIELDS.COMPANY}.ilike.${searchPattern}`);
    }

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

    const { data, error, count } = await query;

    // Log detailed error information for debugging
    if (error) {
      console.error('Error fetching creators from Supabase:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      
      // Check for RLS policy denial - return more helpful message
      const isRLSError = error.message?.includes('row-level security') || 
                         error.code === '42501' ||
                         (error.code === 'PGRST116');
      
      if (isRLSError) {
        return NextResponse.json(
          { 
            error: 'Unable to load creators. Please try again later.',
            code: 'RLS_POLICY_DENIAL',
            details: 'The server returned no data. This may indicate a permissions issue.'
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          error: getUserFriendlyError(error, 'Failed to fetch creators'),
          code: error.code || 'UNKNOWN',
          details: error.details || error.hint || error.message || 'No additional details'
        },
        { status: 500 }
      );
    }

    // Normalize the data to include both field name variants for backward compatibility
    const normalizedData = (data || []).map(user => normalizeUser(user));

    // Return data with count for pagination
    const response = NextResponse.json({
      data: normalizedData,
      count: count || 0
    });
    
    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error: any) {
    // Detailed error logging
    console.error('Unexpected error fetching creators:', {
      error: error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    // Check for specific error types
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      return NextResponse.json(
        { error: 'Request was cancelled. Please try again.' },
        { status: 499 }
      );
    }
    
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return NextResponse.json(
        { error: 'Network error. Please check your connection.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: getUserFriendlyError(error, 'Internal Server Error'),
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}