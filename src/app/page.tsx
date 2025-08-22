import { supabase, TABLES, isSupabaseConfigured } from '@/lib/supabase';
import { EventItem } from '@/lib/types';
import HomePageContent from './HomePageContent';
import { NetworkStatusProvider } from '@/context/NetworkStatusContext';

// Revalidate the page every 60 seconds
export const revalidate = 60;

async function getEvents() {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Please update your .env.local file with valid Supabase credentials.');
    return { events: [], totalEvents: 0, totalUsers: 0, citiesCovered: 0 };
  }

  // Fetch events
  const { data: eventsData, error: eventsError } = await supabase
    .from(TABLES.EVENTS)
    .select('id, name, date, location, category, presale_price, gate_price, image_url, featured, created_by')
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
    image_url: event.image_url || '',
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
    <NetworkStatusProvider>
      <HomePageContent
        initialEvents={events}
        initialTotalEvents={totalEvents}
        initialTotalUsers={totalUsers}
        initialCitiesCovered={citiesCovered}
      />
    </NetworkStatusProvider>
  );
}
