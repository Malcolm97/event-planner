import './globals.css';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import ClientProviders from './ClientProviders';
import '@/lib/polyfills'; // Import polyfills for cross-browser compatibility

import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PNG Events - Discover Local Events',
  description: 'Find concerts, festivals, workshops, and more happening in Papua New Guinea.',
  keywords: 'events, Papua New Guinea, PNG, concerts, festivals, workshops',
  authors: [{ name: 'PNG Events Team' }],
  manifest: '/manifest.json',
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
      </head>
      <body className={`antialiased ${inter.className} min-h-screen safe-area-inset`}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ClientProviders>
          <Header />
          <main id="main-content" role="main">
            {children}
          </main>
        </ClientProviders>
        <Script id="service-worker-script">
          {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/service-worker.js')
                .then((registration) => {
                  console.log('ServiceWorker registration successful with scope:', registration.scope);
                })
                .catch((error) => {
                  console.log('ServiceWorker registration failed:', error);
                });
            });
          }
          `}
        </Script>
      </body>
    </html>
  );
}
