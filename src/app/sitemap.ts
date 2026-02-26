import { MetadataRoute } from 'next';
import { supabase, TABLES, isSupabaseConfigured } from '@/lib/supabase';
import { SITE_CONFIG } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;

  // Static pages with their priorities and change frequencies
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/creators`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/create-event`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/download`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // If Supabase is not configured, return only static pages
  if (!isSupabaseConfigured()) {
    return staticPages;
  }

  try {
    // Fetch all events for dynamic sitemap
    const { data: events, error: eventsError } = await supabase
      .from(TABLES.EVENTS)
      .select('id, updated_at, created_at, date')
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events for sitemap:', eventsError);
      return staticPages;
    }

    // Create sitemap entries for each event
    const eventPages: MetadataRoute.Sitemap = (events || []).map((event) => ({
      url: `${baseUrl}/events/${event.id}`,
      lastModified: new Date(event.updated_at || event.created_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Fetch all categories
    const { data: categories, error: categoriesError } = await supabase
      .from(TABLES.CATEGORIES)
      .select('name, updated_at')
      .order('name');

    if (!categoriesError && categories) {
      const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
        url: `${baseUrl}/categories?category=${encodeURIComponent(category.name)}`,
        lastModified: new Date(category.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
      staticPages.push(...categoryPages);
    }

    // Fetch public profiles/creators
    const { data: profiles, error: profilesError } = await supabase
      .from(TABLES.USERS)
      .select('id, updated_at')
      .eq('is_creator', true)
      .limit(100);

    if (!profilesError && profiles) {
      const profilePages: MetadataRoute.Sitemap = profiles.map((profile) => ({
        url: `${baseUrl}/profile/${profile.id}`,
        lastModified: new Date(profile.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
      staticPages.push(...profilePages);
    }

    return [...staticPages, ...eventPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}