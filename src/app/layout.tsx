import { NetworkStatusProvider } from '@/context/NetworkStatusContext';
import './globals.css';
import ClientOnlineBadge from '@/components/ClientOnlineBadge';
import Script from 'next/script';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NetworkStatusProvider>
      <html lang="en">
        <head>
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body className={`antialiased ${inter.className}`}>
          {children}
          <ClientOnlineBadge />
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
    </NetworkStatusProvider>
  );
}
