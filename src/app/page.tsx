import { supabase, TABLES, isSupabaseConfigured } from '@/lib/supabase';
import { EventItem } from '@/lib/types';
import { Suspense } from 'react';
import ClientHomePageWrapper from './ClientHomePageWrapper';
import Loading from './loading'; // Import the Loading component
import { SITE_CONFIG, PRIMARY_KEYWORDS } from '@/lib/seo';
import { BreadcrumbJsonLd, EventListJsonLd, JsonLd } from '@/components/JsonLd';
import { Metadata } from 'next';

// Revalidate the page every 60 seconds
export const revalidate = 60;

// Home page metadata for SEO
export const metadata: Metadata = {
  title: 'PNG Events in Port Moresby, Lae and Across Papua New Guinea',
  description: 'Discover upcoming concerts, festivals, sports, business, church, school, and community events in Port Moresby, Lae, Mount Hagen, Kokopo, and across Papua New Guinea.',
  keywords: [
    ...PRIMARY_KEYWORDS,
    'Port Moresby concerts',
    'Lae events this weekend',
    'Papua New Guinea event calendar',
    'PNG festivals',
    'things to do in Port Moresby',
    'things to do in Lae',
  ].join(', '),
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  openGraph: {
    type: 'website',
    url: SITE_CONFIG.url,
    title: 'PNG Events in Port Moresby, Lae and Across Papua New Guinea',
    description: 'Discover upcoming concerts, festivals, sports, business, church, school, and community events in Port Moresby, Lae, Mount Hagen, Kokopo, and across Papua New Guinea.',
    images: [
      {
        url: `${SITE_CONFIG.url}/icons/screenshot-desktop.png`,
        width: 1280,
        height: 720,
        alt: 'PNG Events homepage showing events across Papua New Guinea',
      },
    ],
    siteName: 'PNG Events',
    locale: 'en_PG',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pngevents',
    creator: '@pngevents',
    title: 'PNG Events in Port Moresby, Lae and Across Papua New Guinea',
    description: 'Discover upcoming concerts, festivals, sports, business, church, school, and community events across Papua New Guinea.',
    images: [`${SITE_CONFIG.url}/icons/screenshot-desktop.png`],
  },
};

// Fetch stats from our server-side API endpoint
async function getStats() {
  try {
    // Build a reliable absolute URL for server-side fetches.
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
    const baseUrl = configuredUrl
      ? configuredUrl.startsWith('http://') || configuredUrl.startsWith('https://')
        ? configuredUrl
        : `https://${configuredUrl}`
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
  const homePageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'PNG Events in Port Moresby, Lae and Across Papua New Guinea',
    description: 'Discover upcoming concerts, festivals, sports, business, church, school, and community events in Papua New Guinea.',
    url: SITE_CONFIG.url,
    inLanguage: 'en-PG',
    about: [
      'Papua New Guinea events',
      'Port Moresby events',
      'Lae events',
      'PNG festivals',
      'community events in Papua New Guinea',
    ],
    audience: {
      '@type': 'Audience',
      geographicArea: {
        '@type': 'Country',
        name: 'Papua New Guinea',
      },
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.url}/icons/screenshot-desktop.png`,
    },
  };

  return (
    <Suspense fallback={<Loading />}>
      <BreadcrumbJsonLd
        items={[
          {
            name: 'Home',
            url: SITE_CONFIG.url,
          },
        ]}
      />
      <JsonLd data={homePageSchema} />
      <EventListJsonLd
        events={events.map((event) => ({
          id: event.id,
          name: event.name,
          date: event.date,
          location: event.location,
        }))}
        pageTitle="Upcoming Events in Papua New Guinea"
        pageUrl={SITE_CONFIG.url}
      />
      <ClientHomePageWrapper
        initialEvents={events}
        initialTotalEvents={totalEvents}
        initialTotalUsers={totalUsers}
        initialCitiesCovered={citiesCovered}
      />
    </Suspense>
  );
}
