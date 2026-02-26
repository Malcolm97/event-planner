// About Page Layout with SEO Metadata
import { Metadata } from 'next';
import { SITE_CONFIG, PRIMARY_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'About PNG Events - Connecting Papua New Guinea Through Events',
  description: 'Learn about PNG Events, the leading event discovery platform in Papua New Guinea. Our mission is to connect communities through events, making it easy to discover, create, and celebrate what\'s happening across PNG.',
  keywords: [
    ...PRIMARY_KEYWORDS,
    'about PNG Events',
    'Papua New Guinea event platform',
    'PNG community events',
    'event discovery PNG',
    'PNG Events mission',
  ].join(', '),
  alternates: {
    canonical: `${SITE_CONFIG.url}/about`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.url}/about`,
    title: 'About PNG Events - Connecting Papua New Guinea Through Events',
    description: 'Learn about PNG Events, the leading event discovery platform in Papua New Guinea. Our mission is to connect communities through events.',
    images: [
      {
        url: `${SITE_CONFIG.url}/icons/screenshot-desktop.png`,
        width: 1280,
        height: 720,
        alt: 'About PNG Events - Papua New Guinea Event Platform',
      },
    ],
    siteName: 'PNG Events',
    locale: 'en_PG',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pngevents',
    creator: '@pngevents',
    title: 'About PNG Events - Connecting Papua New Guinea Through Events',
    description: 'Learn about PNG Events, the leading event discovery platform in Papua New Guinea.',
    images: [`${SITE_CONFIG.url}/icons/screenshot-desktop.png`],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}