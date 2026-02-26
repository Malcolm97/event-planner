// JSON-LD Structured Data Component for SEO
// This component injects structured data into pages for better search engine understanding

interface JsonLdProps {
  data: object | object[];
}

export function JsonLd({ data }: JsonLdProps) {
  const jsonLdData = Array.isArray(data) ? data : [data];

  return (
    <>
      {jsonLdData.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}

// Organization JSON-LD for the platform
export function OrganizationJsonLd() {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PNG Events',
    alternateName: 'Papua New Guinea Events',
    url: 'https://png-events.vercel.app',
    logo: 'https://png-events.vercel.app/icons/icon-512x512.png',
    description: 'Find concerts, festivals, workshops, sports, and community events happening in Papua New Guinea. Discover what\'s on in Port Moresby, Lae, and across PNG.',
    foundingDate: '2024',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PG',
      addressRegion: 'National Capital District',
      addressLocality: 'Port Moresby',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Tok Pisin'],
    },
    sameAs: [
      'https://twitter.com/pngevents',
      'https://facebook.com/pngevents',
      'https://instagram.com/pngevents',
    ],
    areaServed: {
      '@type': 'Country',
      name: 'Papua New Guinea',
    },
  };

  return <JsonLd data={organizationData} />;
}

// WebSite JSON-LD with search action
export function WebSiteJsonLd() {
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PNG Events',
    alternateName: 'Papua New Guinea Events Platform',
    url: 'https://png-events.vercel.app',
    description: 'Discover and create events in Papua New Guinea. Find concerts, festivals, workshops, sports, and community events.',
    publisher: {
      '@type': 'Organization',
      name: 'PNG Events',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://png-events.vercel.app/events?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <JsonLd data={websiteData} />;
}

// Event JSON-LD for individual events
interface EventJsonLdProps {
  event: {
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
    created_at?: string;
  };
}

export function EventJsonLd({ event }: EventJsonLdProps) {
  const startDate = event.date ? new Date(event.date) : null;
  const endDate = event.end_date ? new Date(event.end_date) : startDate;

  const eventData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description || `Join us for ${event.name} in Papua New Guinea. Find more details, venue information, and ticket prices on PNG Events.`,
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
        streetAddress: event.venue,
      },
    },
    image: event.image_urls && event.image_urls.length > 0 ? event.image_urls : undefined,
    organizer: {
      '@type': 'Organization',
      name: 'PNG Events',
      url: 'https://png-events.vercel.app',
    },
    offers: {
      '@type': 'Offer',
      price: event.presale_price || event.gate_price || 0,
      priceCurrency: 'PGK',
      availability: 'https://schema.org/InStock',
      validFrom: event.created_at ? new Date(event.created_at).toISOString() : undefined,
      url: `https://png-events.vercel.app/events/${event.id}`,
    },
    ...(event.category && {
      eventCategory: event.category,
    }),
  };

  return <JsonLd data={eventData} />;
}

// BreadcrumbList JSON-LD
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `https://png-events.vercel.app${item.url}`,
    })),
  };

  return <JsonLd data={breadcrumbData} />;
}

// LocalBusiness JSON-LD for venues
interface VenueJsonLdProps {
  name: string;
  address?: string;
  city?: string;
  description?: string;
}

export function VenueJsonLd({ name, address, city, description }: VenueJsonLdProps) {
  const venueData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    description: description || `Event venue in ${city || 'Papua New Guinea'}`,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PG',
      addressLocality: city || 'Papua New Guinea',
      streetAddress: address,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Papua New Guinea',
    },
  };

  return <JsonLd data={venueData} />;
}

// ItemList JSON-LD for event listings
interface EventListJsonLdProps {
  events: Array<{
    id: string;
    name: string;
    date: string;
    location?: string;
  }>;
  pageTitle: string;
  pageUrl: string;
}

export function EventListJsonLd({ events, pageTitle, pageUrl }: EventListJsonLdProps) {
  const itemListData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: pageTitle,
    description: `Events in Papua New Guinea - ${pageTitle}`,
    numberOfItems: events.length,
    itemListElement: events.slice(0, 10).map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Event',
        name: event.name,
        startDate: event.date ? new Date(event.date).toISOString() : undefined,
        location: {
          '@type': 'Place',
          name: event.location || 'Papua New Guinea',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'PG',
          },
        },
        url: `https://png-events.vercel.app/events/${event.id}`,
      },
    })),
  };

  return <JsonLd data={itemListData} />;
}

// FAQ JSON-LD for FAQ pages
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQJsonLdProps {
  items: FAQItem[];
}

export function FAQJsonLd({ items }: FAQJsonLdProps) {
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return <JsonLd data={faqData} />;
}

export default JsonLd;