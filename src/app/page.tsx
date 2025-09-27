import { supabase, TABLES } from '@/lib/supabase';
import { EventItem } from '@/lib/types';
import { Suspense } from 'react';
import ClientHomePageWrapper from './ClientHomePageWrapper';
import Loading from './loading'; // Import the Loading component

// Revalidate the page every 60 seconds
export const revalidate = 60;

async function getEvents() {


  // Fetch events
  const { data: eventsData, error: eventsError } = await supabase
    .from(TABLES.EVENTS)
    .select('id, name, date, location, venue, category, presale_price, gate_price, description, image_urls, featured, created_by')
    .order('date', { ascending: true });

  if (eventsError) {
    console.warn('Error fetching events from Supabase:', eventsError.message);
  }

  const events: EventItem[] = (eventsData || []).map((event: any) => ({
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

  // Fetch total events count
  const { count: totalEvents, error: totalEventsError } = await supabase
    .from(TABLES.EVENTS)
    .select('id', { count: 'exact', head: true }); // Select only 'id' to optimize count

  if (totalEventsError) {
    console.error('Error fetching total events:', totalEventsError.message);
  }

  // Fetch total users count
  const { count: totalUsers, error: totalUsersError } = await supabase
    .from(TABLES.USERS)
    .select('id', { count: 'exact', head: true }); // Select only 'id' to optimize count

  if (totalUsersError) {
    console.error('Error fetching total users:', totalUsersError.message);
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
