// Categories Page with Server-Side SEO
import { Metadata } from 'next';
import { Suspense } from 'react';
import { SITE_CONFIG, PRIMARY_KEYWORDS, EVENT_CATEGORIES } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import { supabase, TABLES, isSupabaseConfigured } from '@/lib/supabase';
import CategoriesPageContent from './CategoriesPageContent';

export const metadata: Metadata = {
  title: 'Event Categories in Papua New Guinea - Browse by Category',
  description: 'Explore events by category in Papua New Guinea. Find music concerts, art exhibitions, food festivals, tech meetups, wellness events, and more. Discover what interests you in PNG.',
  keywords: [
    ...PRIMARY_KEYWORDS,
    'music events PNG',
    'art events Papua New Guinea',
    'food festivals PNG',
    'tech events Papua New Guinea',
    'wellness events PNG',
    'sports events Papua New Guinea',
    'community events PNG',
    'event categories',
  ].join(', '),
  alternates: {
    canonical: `${SITE_CONFIG.url}/categories`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.url}/categories`,
    title: 'Event Categories in Papua New Guinea - Browse by Category',
    description: 'Explore events by category in Papua New Guinea. Find music concerts, art exhibitions, food festivals, tech meetups, and more.',
    images: [
      {
        url: `${SITE_CONFIG.url}/icons/screenshot-desktop.png`,
        width: 1280,
        height: 720,
        alt: 'Event Categories in Papua New Guinea - PNG Events',
      },
    ],
    siteName: 'PNG Events',
    locale: 'en_PG',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pngevents',
    creator: '@pngevents',
    title: 'Event Categories in Papua New Guinea - Browse by Category',
    description: 'Explore events by category in Papua New Guinea. Find music, art, food, tech events and more.',
    images: [`${SITE_CONFIG.url}/icons/screenshot-desktop.png`],
  },
};

// Breadcrumb data
const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Categories', url: '/categories' },
];

// Fetch initial data server-side
async function getInitialData() {
  if (!isSupabaseConfigured()) {
    return {
      events: [],
      totalEvents: 0,
      totalUsers: 0,
      citiesCovered: 0,
    };
  }

  try {
    // Get current date for filtering upcoming events
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Fetch events
    const { data: eventsData, error: eventsError } = await supabase
      .from(TABLES.EVENTS)
      .select('id, name, date, end_date, location, venue, category, presale_price, gate_price, description, image_urls, featured, created_by')
      .or(`date.gte.${todayStart},end_date.gte.${todayStart}`)
      .order('date', { ascending: true });

    if (eventsError) {
      console.warn('Error fetching events:', eventsError.message);
    }

    // Fetch stats
    const { count: totalEvents } = await supabase
      .from(TABLES.EVENTS)
      .select('*', { count: 'exact', head: true });

    const { count: totalUsers } = await supabase
      .from(TABLES.USERS)
      .select('*', { count: 'exact', head: true });

    // Get unique cities
    const { data: locationsData } = await supabase
      .from(TABLES.EVENTS)
      .select('location');

    const uniqueCities = new Set<string>();
    (locationsData || []).forEach((item) => {
      if (item.location) {
        const firstPart = item.location.split(',')[0]?.trim();
        if (firstPart) uniqueCities.add(firstPart);
      }
    });

    return {
      events: (eventsData || []).map((event: any) => ({
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
      })),
      totalEvents: totalEvents || 0,
      totalUsers: totalUsers || 0,
      citiesCovered: uniqueCities.size,
    };
  } catch (error) {
    console.error('Error in getInitialData:', error);
    return {
      events: [],
      totalEvents: 0,
      totalUsers: 0,
      citiesCovered: 0,
    };
  }
}

// Define categories
const allCategories = [
  { name: 'All Events', icon: 'FiStar', color: 'bg-gray-200 text-gray-800' },
  { name: 'Music', icon: 'FiMusic', color: 'bg-purple-100 text-purple-600' },
  { name: 'Art', icon: 'FiImage', color: 'bg-pink-100 text-pink-600' },
  { name: 'Food', icon: 'FiCoffee', color: 'bg-orange-100 text-orange-600' },
  { name: 'Technology', icon: 'FiCpu', color: 'bg-blue-100 text-blue-600' },
  { name: 'Wellness', icon: 'FiHeart', color: 'bg-green-100 text-green-600' },
  { name: 'Comedy', icon: 'FiSmile', color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Other', icon: 'FiStar', color: 'bg-gray-100 text-gray-600' },
];

export default async function CategoriesPage() {
  const { events, totalEvents, totalUsers, citiesCovered } = await getInitialData();

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <BreadcrumbJsonLd items={breadcrumbs} />
      
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="text-gray-500 mt-6 text-lg">Loading categories...</p>
          </div>
        </div>
      }>
        <CategoriesPageContent 
          initialEvents={events}
          initialDisplayCategories={allCategories}
          initialTotalEvents={totalEvents}
          initialTotalUsers={totalUsers}
          initialCitiesCovered={citiesCovered}
        />
      </Suspense>
    </>
  );
}