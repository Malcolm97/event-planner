// Events Listing Page with Server-Side SEO
import { Metadata } from 'next';
import { Suspense } from 'react';
import { SITE_CONFIG, PRIMARY_KEYWORDS } from '@/lib/seo';
import { EventListJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd';
import EventsPageContent from './EventsPageContent';

export const metadata: Metadata = {
  title: 'Events in Papua New Guinea - Browse All Events',
  description: 'Discover upcoming events in Papua New Guinea. Browse concerts, festivals, workshops, sports, and community events in Port Moresby, Lae, and across PNG. Find what\'s happening near you.',
  keywords: [
    ...PRIMARY_KEYWORDS,
    'upcoming events PNG',
    'events today PNG',
    'events this weekend Papua New Guinea',
    'browse events PNG',
    'local events Papua New Guinea',
  ].join(', '),
  alternates: {
    canonical: `${SITE_CONFIG.url}/events`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.url}/events`,
    title: 'Events in Papua New Guinea - Browse All Events',
    description: 'Discover upcoming events in Papua New Guinea. Browse concerts, festivals, workshops, sports, and community events in Port Moresby, Lae, and across PNG.',
    images: [
      {
        url: `${SITE_CONFIG.url}/icons/screenshot-desktop.png`,
        width: 1280,
        height: 720,
        alt: 'Events in Papua New Guinea - PNG Events',
      },
    ],
    siteName: 'PNG Events',
    locale: 'en_PG',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pngevents',
    creator: '@pngevents',
    title: 'Events in Papua New Guinea - Browse All Events',
    description: 'Discover upcoming events in Papua New Guinea. Browse concerts, festivals, workshops, and more.',
    images: [`${SITE_CONFIG.url}/icons/screenshot-desktop.png`],
  },
};

// Breadcrumb data
const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Events', url: '/events' },
];

export default function EventsPage() {
  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <BreadcrumbJsonLd items={breadcrumbs} />
      
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="text-gray-500 mt-6 text-lg">Loading events...</p>
          </div>
        </div>
      }>
        <EventsPageContent />
      </Suspense>
    </>
  );
}