import './globals.css';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';

const NetworkStatusProvider = dynamic(
  () => import('@/context/NetworkStatusContext').then(mod => mod.NetworkStatusProvider),
  { ssr: false }
);

const ClientOnlineBadge = dynamic(
  () => import('@/components/ClientOnlineBadge'),
  { ssr: false }
);

const Toaster = dynamic(
  () => import('react-hot-toast').then(mod => mod.Toaster),
  { ssr: false }
);

const SyncIndicator = dynamic(() => import('@/components/SyncIndicator'), {
  ssr: false
});

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PNG Events - Discover Local Events',
  description: 'Find concerts, festivals, workshops, and more happening in Papua New Guinea.',
  keywords: 'events, Papua New Guinea, PNG, concerts, festivals, workshops',
  authors: [{ name: 'PNG Events Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#FCD34D',
  manifest: '/manifest.json',
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
      <body className={`antialiased ${inter.className}`}>
        <ErrorBoundary>
        <NetworkStatusProvider>
          <>
            {children}
            <ClientOnlineBadge />
            <SyncIndicator />
            <Toaster position="bottom-center" />
          </>
        </NetworkStatusProvider>
        </ErrorBoundary>
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
