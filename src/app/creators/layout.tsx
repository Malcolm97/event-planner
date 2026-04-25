import { Metadata } from 'next';
import { SITE_CONFIG, PRIMARY_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Event Creators in Papua New Guinea',
  description:
    'Discover event creators and organizers across Papua New Guinea. Find active hosts in Port Moresby and around PNG to follow upcoming events.',
  keywords: [
    ...PRIMARY_KEYWORDS,
    'event creators PNG',
    'event organizers Papua New Guinea',
    'Port Moresby event organizers',
    'PNG event hosts',
  ].join(', '),
  alternates: {
    canonical: `${SITE_CONFIG.url}/creators`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.url}/creators`,
    title: 'Event Creators in Papua New Guinea',
    description:
      'Discover event creators and organizers across Papua New Guinea. Follow hosts and explore upcoming events.',
    images: [
      {
        url: `${SITE_CONFIG.url}/icons/screenshot-desktop.png`,
        width: 1280,
        height: 720,
        alt: 'Event creators in Papua New Guinea',
      },
    ],
    siteName: 'PNG Events',
    locale: 'en_PG',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pngevents',
    creator: '@pngevents',
    title: 'Event Creators in Papua New Guinea',
    description:
      'Discover event creators and organizers across Papua New Guinea. Follow hosts and explore upcoming events.',
    images: [`${SITE_CONFIG.url}/icons/screenshot-desktop.png`],
  },
};

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
