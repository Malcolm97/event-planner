// Copyright 2024 PNG Events. All rights reserved.
// This software and its associated intellectual property are protected by copyright law.
// Unauthorized copying, modification, or distribution is prohibited.

import './globals.css';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import ClientProviders from './ClientProviders';
import { EnhancedErrorBoundary } from '@/components/EnhancedErrorBoundary';
import '@/lib/polyfills'; // Import polyfills for cross-browser compatibility

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OnlineBadge from '@/components/OnlineBadge';
import OfflineIndicator from '@/components/OfflineIndicator';
import UpdatePrompt from '@/components/UpdatePrompt';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PNG Events - Discover Local Events',
  description: 'Find concerts, festivals, workshops, and more happening in Papua New Guinea.',
  keywords: 'events, Papua New Guinea, PNG, concerts, festivals, workshops',
  authors: [{ name: 'PNG Events Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon-180x180.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FCD34D',
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
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PNG Events" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://dvqmdzzekmegwzcwfara.supabase.co" />
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="preconnect" href="https://www.gstatic.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* iOS Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-touch-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-touch-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-touch-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-touch-icon-72x72.png" />

        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/icons/splash-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/splash-1668x2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/splash-1536x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/icons/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />

        {/* Additional iOS meta tags */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#FCD34D" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`antialiased ${inter.className} min-h-screen safe-area-inset`}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <EnhancedErrorBoundary>
          <ClientProviders>
            <OfflineIndicator />
            <Header />
            <main id="main-content" role="main" className="pb-16 sm:pb-20 md:pb-20 lg:pb-0 min-h-screen">
              {children}
            </main>
            <BottomNav />
            <PWAInstallPrompt />
            <OnlineBadge />
            <UpdatePrompt />
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
