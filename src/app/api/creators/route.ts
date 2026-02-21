import { NextResponse } from 'next/server';
import { supabase, TABLES, isSupabaseConfigured } from '@/lib/supabase';
import { getUserFriendlyError } from '@/lib/userMessages';

// Public endpoint for fetching creator profiles
// This endpoint is accessible without authentication and returns only public user information
export async function GET(request: Request) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.error('Supabase is not configured for /api/creators');
      return NextResponse.json(
        { error: 'Service configuration error. Please contact support.', details: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const fields = searchParams.get('fields');

    // Only fetch public fields - no sensitive information
    const publicFields = 'id, name, email, phone, company, about, photo_url, role, updated_at';
    const selectedFields = fields || publicFields;

    let query = supabase
      .from(TABLES.USERS)
      .select(selectedFields, { count: 'exact' })
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

    const { data, error, count, status, statusText } = await query;

    // Log detailed error information for debugging
    if (error) {
      const errorInfo = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: status,
        statusText: statusText
      };
      
      console.error('Error fetching creators from Supabase:', errorInfo);
      
      // Check for RLS policy denial - return more helpful message
      const isRLSError = error.message?.includes('row-level security') || 
                         error.code === '42501' ||
                         (status === 200 && !data);
      
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

    // Return data with count for pagination
    return NextResponse.json({
      data: data || [],
      count: count || 0
    });
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
