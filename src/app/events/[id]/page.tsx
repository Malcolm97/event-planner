// Event Detail Page with Server-Side SEO
// This page uses server-side rendering for optimal SEO performance

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase, TABLES, isSupabaseConfigured } from '@/lib/supabase';
import { SITE_CONFIG, generatePageTitle, generateMetaDescription } from '@/lib/seo';
import { EventJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd';
import EventDetailClient from './EventDetailClient';

// Generate static params for all events
export async function generateStaticParams() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data: events } = await supabase
      .from(TABLES.EVENTS)
      .select('id')
      .limit(100);

    return (events || []).map((event) => ({
      id: event.id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Generate dynamic metadata for each event
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  
  if (!isSupabaseConfigured()) {
    return {
      title: 'Event Not Found',
      description: 'The event you are looking for could not be found.',
    };
  }

  try {
    const { data: event, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !event) {
      return {
        title: 'Event Not Found',
        description: 'The event you are looking for could not be found on PNG Events.',
      };
    }

    // Generate SEO-optimized title
    const title = generatePageTitle(`${event.name} - ${event.location || 'Papua New Guinea'}`);
    
    // Generate SEO-optimized description
    const description = generateMetaDescription(
      event.description || `Join us for ${event.name} in ${event.location || 'Papua New Guinea'}. Find event details, venue information, and ticket prices on PNG Events.`,
      160
    );

    // Generate keywords based on event
    const keywords = [
      event.name,
      event.location,
      event.category,
      'PNG events',
      'Papua New Guinea events',
      'events in PNG',
      event.venue,
    ].filter(Boolean).join(', ');

    const eventUrl = `${SITE_CONFIG.url}/events/${id}`;
    const imageUrl = event.image_urls && event.image_urls.length > 0 
      ? event.image_urls[0] 
      : `${SITE_CONFIG.url}/icons/screenshot-desktop.png`;

    return {
      title: event.name,
      description,
      keywords,
      authors: [{ name: 'PNG Events' }],
      alternates: {
        canonical: eventUrl,
      },
      openGraph: {
        type: 'article',
        url: eventUrl,
        title: event.name,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${event.name} - Event in ${event.location || 'Papua New Guinea'}`,
          },
        ],
        siteName: 'PNG Events',
        locale: 'en_PG',
        ...(event.date && { publishedTime: new Date(event.date).toISOString() }),
      },
      twitter: {
        card: 'summary_large_image',
        site: '@pngevents',
        creator: '@pngevents',
        title: event.name,
        description,
        images: [imageUrl],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Event - PNG Events',
      description: 'Discover events in Papua New Guinea.',
    };
  }
}

// Fetch event data server-side
async function getEvent(id: string) {
  if (!isSupabaseConfigured()) {
    return { event: null, host: null };
  }

  try {
    const { data: event, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !event) {
      return { event: null, host: null };
    }

    // Fetch host information
    let host = null;
    if (event.created_by) {
      const { data: hostData } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', event.created_by)
        .single();
      host = hostData;
    }

    return { event, host };
  } catch (error) {
    console.error('Error fetching event:', error);
    return { event: null, host: null };
  }
}

// Server Component for Event Detail Page
export default async function EventDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const { event, host } = await getEvent(id);

  if (!event) {
    notFound();
  }

  const eventUrl = `${SITE_CONFIG.url}/events/${id}`;

  // Breadcrumb data
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Events', url: '/events' },
    { name: event.name, url: `/events/${id}` },
  ];

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <EventJsonLd event={event} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      
      {/* Client Component for interactivity */}
      <EventDetailClient event={event} host={host} />
    </>
  );
}