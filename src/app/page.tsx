import { supabase, TABLES, isSupabaseConfigured } from '@/lib/supabase';
import { EventItem } from '@/lib/types';
import { Suspense } from 'react';
import ClientHomePageWrapper from './ClientHomePageWrapper';
import Loading from './loading'; // Import the Loading component

// Revalidate the page every 60 seconds
export const revalidate = 60;

// Fetch stats from our server-side API endpoint
async function getStats() {
  try {
    // Use internal fetch with absolute URL for server-side rendering
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/stats`, {
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    
    if (!response.ok) {
      return { totalUsers: 0, totalEvents: 0, citiesCovered: 0 };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { totalUsers: 0, totalEvents: 0, citiesCovered: 0 };
  }
}

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

  try {
    // Get current date for filtering upcoming events
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Fetch upcoming and current events (events that haven't ended yet)
    // We fetch events where date >= today OR end_date >= today (for multi-day events currently happening)
    const { data: eventsData, error: eventsError } = await supabase
      .from(TABLES.EVENTS)
      .select('id, name, date, end_date, location, venue, category, presale_price, gate_price, description, image_urls, featured, created_by')
      .or(`date.gte.${todayStart},end_date.gte.${todayStart}`)
      .order('date', { ascending: true });

    if (eventsError) {
      console.warn('Error fetching events from Supabase:', eventsError.message);
    } else {
      events = (eventsData || []).map((event: any) => ({
        ...event,
        date: event.date ? String(event.date) : '',
        end_date: event.end_date ? String(event.end_date) : null,
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

  // Fetch stats from the dedicated API endpoint
  const stats = await getStats();

  return {
    events,
    totalEvents: stats.totalEvents,
    totalUsers: stats.totalUsers,
    citiesCovered: stats.citiesCovered,
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
