import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { getUserFriendlyError } from '@/lib/userMessages';

// Helper function to check admin access
async function checkAdminAccess() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { isAdmin: false, error: 'Not authenticated' }
    }

    const { data: userData, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError) {
      const isUserNotFound = userError.code === 'PGRST116' ||
                               userError.message?.includes('No rows found') ||
                               userError.code === 'PGRST204' ||
                               !userError.code

      if (isUserNotFound) {
        return { isAdmin: false, error: 'We couldn\'t find your profile. Please try signing in again.' }
      } else {
        return { isAdmin: false, error: getUserFriendlyError(userError, 'Something went wrong. Please try again.') }
      }
    }

    return { isAdmin: userData?.role === 'admin', user }
  } catch (error) {
    return { isAdmin: false, error: getUserFriendlyError(error, 'Something unexpected happened. Please try again.') }
  }
}

export async function GET(request: Request) {
  try {
    // Check admin access - only admins can list all users
    const adminCheck = await checkAdminAccess()
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error || 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const fields = searchParams.get('fields');

    // Define default fields for performance - only fetch what's needed
    const defaultFields = 'id, name, email, phone, company, about, photo_url, role, updated_at';
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
      return NextResponse.json(
        { error: getUserFriendlyError(error, 'Failed to fetch users') },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Unexpected error fetching users:', error.message);
    return NextResponse.json(
      { error: getUserFriendlyError(error, 'Internal Server Error') },
      { status: 500 }
    );
  }
}
