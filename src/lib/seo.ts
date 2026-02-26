// SEO Utility Functions for PNG Events
// Centralized SEO configuration and helpers

export const SITE_CONFIG = {
  name: 'PNG Events',
  fullName: 'PNG Events - Discover Local Events in Papua New Guinea',
  description: 'Find concerts, festivals, workshops, sports, and community events happening in Papua New Guinea. Discover what\'s on in Port Moresby, Lae, and across PNG.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://png-events.vercel.app',
  locale: 'en_PG',
  language: 'en',
  timezone: 'Pacific/Port_Moresby',
  
  // Social media handles
  twitter: '@pngevents',
  facebook: 'pngevents',
  instagram: 'pngevents',
  
  // Contact information
  email: 'hello@png-events.com',
  
  // Geographic information for local SEO
  geo: {
    region: 'PG',
    country: 'Papua New Guinea',
    countryCode: 'PG',
    cities: ['Port Moresby', 'Lae', 'Mount Hagen', 'Madang', 'Goroka', 'Kokopo', 'Alotau', 'Wewak'],
  },
};

// Primary keywords for PNG Events
export const PRIMARY_KEYWORDS = [
  'events in PNG',
  'events in Papua New Guinea',
  'PNG events',
  'Papua New Guinea events',
  'what\'s on PNG',
  'things to do in Papua New Guinea',
  'Port Moresby events',
  'Lae events',
  'PNG community events',
];

// Secondary keywords
export const SECONDARY_KEYWORDS = [
  'concerts PNG',
  'festivals Papua New Guinea',
  'workshops PNG',
  'sports events PNG',
  'music events Papua New Guinea',
  'art exhibitions PNG',
  'food festivals PNG',
  'cultural events Papua New Guinea',
  'business events PNG',
  'networking events Port Moresby',
];

// Long-tail keywords
export const LONG_TAIL_KEYWORDS = [
  'find events near me PNG',
  'upcoming events in Papua New Guinea',
  'event tickets PNG',
  'free events Papua New Guinea',
  'weekend events Port Moresby',
  'family events PNG',
  'outdoor events Papua New Guinea',
  'local events near me PNG',
  'what to do this weekend PNG',
  'PNG event calendar',
];

// All keywords combined
export const ALL_KEYWORDS = [
  ...PRIMARY_KEYWORDS,
  ...SECONDARY_KEYWORDS,
  ...LONG_TAIL_KEYWORDS,
  'events',
  'concerts',
  'festivals',
  'workshops',
  'sports',
  'music',
  'art',
  'food',
  'culture',
  'community',
];

// Event categories with SEO-friendly names and descriptions
export const EVENT_CATEGORIES = {
  Music: {
    name: 'Music Events',
    description: 'Concerts, live music, DJ nights, and music festivals in Papua New Guinea',
    keywords: ['music events PNG', 'concerts Papua New Guinea', 'live music PNG', 'DJ nights Port Moresby'],
  },
  Art: {
    name: 'Art Events',
    description: 'Art exhibitions, galleries, and creative workshops in Papua New Guinea',
    keywords: ['art exhibitions PNG', 'galleries Papua New Guinea', 'art workshops PNG'],
  },
  Food: {
    name: 'Food Events',
    description: 'Food festivals, markets, and culinary events in Papua New Guinea',
    keywords: ['food festivals PNG', 'food markets Papua New Guinea', 'culinary events PNG'],
  },
  Technology: {
    name: 'Technology Events',
    description: 'Tech meetups, hackathons, and digital events in Papua New Guinea',
    keywords: ['tech events PNG', 'hackathons Papua New Guinea', 'IT meetups PNG'],
  },
  Wellness: {
    name: 'Wellness Events',
    description: 'Health, fitness, and wellness events in Papua New Guinea',
    keywords: ['wellness events PNG', 'fitness Papua New Guinea', 'health events PNG'],
  },
  Comedy: {
    name: 'Comedy Events',
    description: 'Stand-up comedy and entertainment shows in Papua New Guinea',
    keywords: ['comedy shows PNG', 'stand-up comedy Papua New Guinea', 'entertainment PNG'],
  },
  Sports: {
    name: 'Sports Events',
    description: 'Sports matches, tournaments, and athletic events in Papua New Guinea',
    keywords: ['sports events PNG', 'tournaments Papua New Guinea', 'athletic events PNG'],
  },
  Community: {
    name: 'Community Events',
    description: 'Community gatherings, cultural events, and social meetups in Papua New Guinea',
    keywords: ['community events PNG', 'cultural events Papua New Guinea', 'social meetups PNG'],
  },
};

// Generate page title with proper formatting
export function generatePageTitle(title: string, includeSiteName = true): string {
  if (includeSiteName) {
    return `${title} | PNG Events - Papua New Guinea Events`;
  }
  return title;
}

// Generate meta description with proper length (150-160 characters ideal)
export function generateMetaDescription(description: string, maxLength = 160): string {
  if (description.length <= maxLength) {
    return description;
  }
  return description.substring(0, maxLength - 3) + '...';
}

// Generate Open Graph image URL
export function generateOgImageUrl(imageUrl?: string, title?: string): string {
  if (imageUrl) {
    return imageUrl;
  }
  // Default OG image
  return `${SITE_CONFIG.url}/icons/screenshot-desktop.png`;
}

// Generate canonical URL
export function generateCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.url}${cleanPath}`;
}

// Generate JSON-LD for Organization
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/icons/icon-512x512.png`,
    description: SITE_CONFIG.description,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PG',
      addressRegion: 'National Capital District',
      addressLocality: 'Port Moresby',
    },
    sameAs: [
      `https://twitter.com/${SITE_CONFIG.twitter.replace('@', '')}`,
      `https://facebook.com/${SITE_CONFIG.facebook}`,
      `https://instagram.com/${SITE_CONFIG.instagram}`,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: SITE_CONFIG.email,
      contactType: 'customer service',
      availableLanguage: ['English', 'Tok Pisin'],
    },
  };
}

// Generate JSON-LD for WebSite
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/events?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// Generate JSON-LD for Event
export function generateEventSchema(event: {
  id: string;
  name: string;
  description?: string;
  date: string;
  end_date?: string | null;
  location?: string;
  venue?: string;
  image_urls?: string[];
  presale_price?: number;
  gate_price?: number;
  category?: string;
}) {
  const startDate = event.date ? new Date(event.date) : null;
  const endDate = event.end_date ? new Date(event.end_date) : startDate;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description || `Event in Papua New Guinea - ${event.name}`,
    startDate: startDate ? startDate.toISOString() : undefined,
    endDate: endDate ? endDate.toISOString() : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.venue || event.location || 'Papua New Guinea',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'PG',
        addressLocality: event.location || 'Papua New Guinea',
      },
    },
    image: event.image_urls && event.image_urls.length > 0 ? event.image_urls[0] : undefined,
    offers: {
      '@type': 'Offer',
      price: event.presale_price || event.gate_price || 0,
      priceCurrency: 'PGK',
      availability: 'https://schema.org/InStock',
      validFrom: startDate ? startDate.toISOString() : undefined,
    },
    organizer: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  };
}

// Generate JSON-LD for BreadcrumbList
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}

// Generate JSON-LD for LocalBusiness (for event venues)
export function generateLocalBusinessSchema(venue: {
  name: string;
  address?: string;
  city?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: venue.name,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PG',
      addressLocality: venue.city || 'Papua New Guinea',
      streetAddress: venue.address,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Papua New Guinea',
    },
  };
}

// Format event date for display
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: SITE_CONFIG.timezone,
  });
}

// Generate event URL
export function generateEventUrl(eventId: string): string {
  return `${SITE_CONFIG.url}/events/${eventId}`;
}

// Generate category URL
export function generateCategoryUrl(category: string): string {
  return `${SITE_CONFIG.url}/categories?category=${encodeURIComponent(category)}`;
}