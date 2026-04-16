import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { TABLES, USER_FIELDS } from '@/lib/supabase';
import { getUserFriendlyError } from '@/lib/userMessages';
import { normalizeUser } from '@/lib/types';

interface CreatorEventSummary {
  id: string;
  name: string;
  date: string | null;
  end_date: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  location?: string | null;
  venue?: string | null;
  created_by?: string | null;
}

interface CreatorSummary {
  id: string;
  eventsCount: number;
  hasUpcomingEvent: boolean;
  latestEvent: CreatorEventSummary | null;
  allEvents: CreatorEventSummary[];
}

function isSummaryEventUpcomingOrActive(event: CreatorEventSummary): boolean {
  if (!event?.date) return false;

  const now = new Date();
  const eventDate = new Date(event.date);

  if (event.end_date) {
    const endDate = new Date(event.end_date);
    return now <= endDate;
  }

  const endOfEventDay = new Date(eventDate);
  endOfEventDay.setHours(23, 59, 59, 999);
  return now <= endOfEventDay;
}

function buildCreatorSummary(events: CreatorEventSummary[]): CreatorSummary {
  const upcomingEvents = events.filter((event) => isSummaryEventUpcomingOrActive(event));
  const sortedUpcoming = [...upcomingEvents].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
  const sortedPast = [...events.filter((event) => !isSummaryEventUpcomingOrActive(event))].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
  const orderedEvents = [...sortedUpcoming, ...sortedPast];

  return {
    id: events[0]?.created_by || '',
    eventsCount: events.length,
    hasUpcomingEvent: sortedUpcoming.length > 0,
    latestEvent: sortedUpcoming[0] || orderedEvents[0] || null,
    allEvents: orderedEvents.slice(0, 12),
  };
}

// Public endpoint for fetching creator profiles
// This endpoint is accessible without authentication and returns only public user information
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const search = searchParams.get('search');
    const includeEventSummary = searchParams.get('includeEventSummary') !== 'false';

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
        ${USER_FIELDS.UPDATED_AT},
        ${USER_FIELDS.CONTACT_METHOD},
        ${USER_FIELDS.WHATSAPP_NUMBER},
        ${USER_FIELDS.CONTACT_VISIBILITY},
        ${USER_FIELDS.SOCIAL_LINKS},
        ${USER_FIELDS.SHOW_SOCIAL_LINKS}
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

    let creatorsWithSummary = normalizedData;

    if (includeEventSummary && normalizedData.length > 0) {
      const creatorIds = normalizedData.map((creator) => creator.id);
      const { data: eventsData, error: eventsError } = await supabase
        .from(TABLES.EVENTS)
        .select('id, name, date, end_date, image_url, image_urls, location, venue, created_by')
        .in('created_by', creatorIds);

      if (eventsError) {
        console.error('Error fetching creator events from Supabase:', {
          message: eventsError.message,
          code: eventsError.code,
          details: eventsError.details,
          hint: eventsError.hint,
        });
      } else {
        const eventsByCreator = new Map<string, CreatorEventSummary[]>();

        for (const rawEvent of (eventsData || []) as CreatorEventSummary[]) {
          if (!rawEvent?.created_by) continue;
          const current = eventsByCreator.get(rawEvent.created_by) || [];
          current.push(rawEvent);
          eventsByCreator.set(rawEvent.created_by, current);
        }

        creatorsWithSummary = normalizedData
          .filter((creator) => eventsByCreator.has(creator.id))
          .map((creator) => {
            const creatorEvents = eventsByCreator.get(creator.id) || [];
            const summary = buildCreatorSummary(creatorEvents);

            return {
              ...creator,
              eventsCount: summary.eventsCount,
              hasUpcomingEvent: summary.hasUpcomingEvent,
              latestEvent: summary.latestEvent,
              allEvents: summary.allEvents,
            };
          });
      }
    }

    // Return data with count for pagination
    const response = NextResponse.json({
      data: creatorsWithSummary,
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