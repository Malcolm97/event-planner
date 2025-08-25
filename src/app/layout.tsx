import './globals.css';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`antialiased ${inter.className}`}>
        <NetworkStatusProvider>
          <>
            {children}
            <ClientOnlineBadge />
            <SyncIndicator />
            <Toaster position="bottom-center" />
          </>
        </NetworkStatusProvider>
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
