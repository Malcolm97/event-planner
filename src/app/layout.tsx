// Copyright 2024 PNG Events. All rights reserved.
// This software and its associated intellectual property are protected by copyright law.
// Unauthorized copying, modification, or distribution is prohibited.

import './globals.css';
import Script from 'next/script';
import localFont from 'next/font/local';
import ClientProviders from './ClientProviders';
import { EnhancedErrorBoundary } from '@/components/EnhancedErrorBoundary';
import '@/lib/polyfills'; // Import polyfills for cross-browser compatibility

import MainLayout from '@/components/MainLayout';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/JsonLd';
import { SITE_CONFIG, ALL_KEYWORDS } from '@/lib/seo';

// Use local fonts to avoid Turbopack build issues with Google Fonts
const inter = localFont({
  src: [
    {
      path: '../../public/fonts/Inter-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
});

// Enhanced metadata for SEO optimization
export const metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: 'PNG Events - Discover Events in Papua New Guinea',
    template: `%s | PNG Events`,
  },
  description: 'Find concerts, festivals, workshops, sports, and community events happening in Papua New Guinea. Discover what\'s on in Port Moresby, Lae, and across PNG. Your go-to platform for events in PNG.',
  keywords: ALL_KEYWORDS.join(', '),
  authors: [{ name: 'PNG Events Team', url: SITE_CONFIG.url }],
  creator: 'PNG Events',
  publisher: 'PNG Events',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  alternates: {
    canonical: SITE_CONFIG.url,
    languages: {
      'en-PG': SITE_CONFIG.url,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_PG',
    url: SITE_CONFIG.url,
    siteName: 'PNG Events',
    title: 'PNG Events - Discover Events in Papua New Guinea',
    description: 'Find concerts, festivals, workshops, sports, and community events happening in Papua New Guinea. Discover what\'s on in Port Moresby, Lae, and across PNG.',
    images: [
      {
        url: `${SITE_CONFIG.url}/icons/screenshot-desktop.png`,
        width: 1280,
        height: 720,
        alt: 'PNG Events - Discover Events in Papua New Guinea',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pngevents',
    creator: '@pngevents',
    title: 'PNG Events - Discover Events in Papua New Guinea',
    description: 'Find concerts, festivals, workshops, sports, and community events happening in Papua New Guinea.',
    images: [`${SITE_CONFIG.url}/icons/screenshot-desktop.png`],
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
  verification: {
    google: 'google-site-verification-code', // Replace with actual verification code
  },
  category: 'Events',
  classification: 'Event Discovery Platform',
  appLinks: {
    web: {
      url: SITE_CONFIG.url,
      should_fallback: true,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FCD34D' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FCD34D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PNG Events" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://dvqmdzzekmegwzcwfara.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="preconnect" href="https://www.gstatic.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* Preload critical assets */}
        <link rel="preload" href="/manifest.json" as="fetch" crossOrigin="anonymous" />
        
        {/* iOS Icons - All sizes for best compatibility */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-touch-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-touch-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-touch-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-touch-icon-72x72.png" />

        {/* iOS Splash Screens - iPhone 14 Pro Max / 15 Pro Max / 16 Pro Max (430x932 @3x) - using 1242x2688 as fallback */}
        <link rel="apple-touch-startup-image" href="/icons/splash-1242x2688.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        {/* iOS Splash Screens - iPhone 14 Pro / 15 Pro / 16 Pro (393x852 @3x) - using 1125x2436 as fallback */}
        <link rel="apple-touch-startup-image" href="/icons/splash-1125x2436.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        {/* iOS Splash Screens - iPhone 14 Plus / 15 Plus / 16 Plus (428x926 @3x) - using 1242x2688 as fallback */}
        <link rel="apple-touch-startup-image" href="/icons/splash-1242x2688.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        {/* iOS Splash Screens - iPhone 14 / 15 / 16 (390x844 @3x) - using 1125x2436 as fallback */}
        <link rel="apple-touch-startup-image" href="/icons/splash-1125x2436.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        {/* iOS Splash Screens - iPhone 11 Pro Max / XS Max (414x896 @3x) */}
        <link rel="apple-touch-startup-image" href="/icons/splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        {/* iOS Splash Screens - iPhone 11 / XR (414x896 @2x) */}
        <link rel="apple-touch-startup-image" href="/icons/splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        {/* iOS Splash Screens - iPhone 11 Pro / XS / 14 Pro / 15 Pro (375x812 @3x) */}
        <link rel="apple-touch-startup-image" href="/icons/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        {/* iOS Splash Screens - iPhone 8 Plus / 7 Plus / 6s Plus (414x736 @3x) - using 1242x2688 as closest available */}
        <link rel="apple-touch-startup-image" href="/icons/splash-1242x2688.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        {/* iOS Splash Screens - iPhone 8 / 7 / 6s / SE 2nd/3rd (375x667 @2x) */}
        <link rel="apple-touch-startup-image" href="/icons/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        {/* iOS Splash Screens - iPad Pro 12.9" (1024x1366 @2x) */}
        <link rel="apple-touch-startup-image" href="/icons/splash-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        {/* iOS Splash Screens - iPad Pro 11" (834x1194 @2x) */}
        <link rel="apple-touch-startup-image" href="/icons/splash-1668x2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        {/* iOS Splash Screens - iPad Air / Mini (768x1024 @2x) */}
        <link rel="apple-touch-startup-image" href="/icons/splash-1536x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />

        {/* Additional iOS meta tags for PWA */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Windows/Edge PWA meta tags */}
        <meta name="msapplication-TileColor" content="#FCD34D" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-notification" content="frequency=30;polling-uri=https://png-events.vercel.app/api/notifications;cycle=1" />
        
        {/* Additional PWA optimizations */}
        <meta name="color-scheme" content="light dark" />
        <meta name="prefers-color-scheme" content="light" />
      </head>
      <body className={`antialiased ${inter.className} min-h-screen`}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        
        {/* JSON-LD Structured Data for SEO */}
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        
        <EnhancedErrorBoundary>
          <ClientProviders>
            <MainLayout>{children}</MainLayout>
          </ClientProviders>
        </EnhancedErrorBoundary>
        <Script id="service-worker-script">
          {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/service-worker.js')
                .then((registration) => {
                  console.log('ServiceWorker registration successful with scope:', registration.scope);
                  
                  // Check for updates immediately after registration
                  if (registration.update) {
                    registration.update();
                  }
                  
                  // Listen for updates
                  registration.addEventListener('updatefound', () => {
                    console.log('New service worker found, installing...');
                    const newWorker = registration.installing;
                    if (newWorker) {
                      newWorker.addEventListener('statechange', () => {
                        console.log('Service worker state changed:', newWorker.state);
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          console.log('New service worker is ready to activate');
                          // The UpdatePrompt component will handle showing the update prompt
                        }
                      });
                    }
                  });
                })
                .catch((error) => {
                  console.log('ServiceWorker registration failed:', error);
                });
            });
            
            // Listen for controller changes (new SW activated)
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              console.log('Service worker controller changed');
              if (!refreshing) {
                refreshing = true;
                // Reload to get fresh content
                window.location.reload();
              }
            });
          }

          // Track user interactions and page load time for PWA install prompt timing
          window.pageLoadTime = Date.now();
          window.userHasInteracted = false;

          // Track user interactions
          const trackInteraction = () => {
            window.userHasInteracted = true;
            // Remove listeners after first interaction
            document.removeEventListener('click', trackInteraction);
            document.removeEventListener('touchstart', trackInteraction);
            document.removeEventListener('keydown', trackInteraction);
            document.removeEventListener('scroll', trackInteraction);
          };

          document.addEventListener('click', trackInteraction, { once: true });
          document.addEventListener('touchstart', trackInteraction, { once: true });
          document.addEventListener('keydown', trackInteraction, { once: true });
          document.addEventListener('scroll', trackInteraction, { once: true });
          `}
        </Script>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
