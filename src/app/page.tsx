import { supabase, TABLES, isSupabaseConfigured, getEventsCount, getUserCount } from '@/lib/supabase';
import { EventItem } from '@/lib/types';
import { Suspense } from 'react';
import ClientHomePageWrapper from './ClientHomePageWrapper';
import Loading from './loading'; // Import the Loading component

// Revalidate the page every 60 seconds
export const revalidate = 60;

async function getEvents() {
  // Check if Supabase is properly configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not properly configured. Using fallback values.');
    return {
      events: [],
      totalEvents: 0,
      totalUsers: 0,
      citiesCovered: 0,
    };
  }

  let events: EventItem[] = [];
  let totalEvents = 0;
  let totalUsers = 0;

  try {
    // Fetch events
    const { data: eventsData, error: eventsError } = await supabase
      .from(TABLES.EVENTS)
      .select('id, name, date, location, venue, category, presale_price, gate_price, description, image_urls, featured, created_by')
      .order('date', { ascending: true });

    if (eventsError) {
      console.warn('Error fetching events from Supabase:', eventsError.message);
    } else {
      events = (eventsData || []).map((event: any) => ({
        ...event,
        date: event.date ? String(event.date) : '',
        id: String(event.id),
        name: event.name,
        location: event.location || '',
        description: event.description || '',
        category: event.category || 'Other',
        presale_price: event.presale_price ?? 0,
        gate_price: event.gate_price ?? 0,
        image_urls: event.image_urls || [],
        created_at: event.created_at || '',
        featured: event.featured || false,
        created_by: event.created_by || '',
      }));
    }

    // Fetch total events count using utility function
    totalEvents = await getEventsCount();

    // Fetch total users count using utility function
    totalUsers = await getUserCount();

  } catch (error) {
    console.error('Unexpected error in getEvents:', error);
    // Return fallback values on any error
    return {
      events: [],
      totalEvents: 0,
      totalUsers: 0,
      citiesCovered: 0,
    };
  }

  // Calculate cities covered
  const uniqueCities = new Set<string>();
  if (events.length > 0) {
    events.forEach((event: EventItem) => {
      if (event.location) {
        const firstPart = event.location.split(',')[0]?.trim();
        if (firstPart) {
          uniqueCities.add(firstPart);
        }
      }
    });
  }
  const citiesCovered = uniqueCities.size;

  return {
    events,
    totalEvents,
    totalUsers,
    citiesCovered,
  };
}

export default async function Home() {
  const { events, totalEvents, totalUsers, citiesCovered } = await getEvents();

  return (
    <Suspense fallback={<Loading />}>
      <ClientHomePageWrapper
        initialEvents={events}
        initialTotalEvents={totalEvents}
        initialTotalUsers={totalUsers}
        initialCitiesCovered={citiesCovered}
      />
    </Suspense>
  );
}
