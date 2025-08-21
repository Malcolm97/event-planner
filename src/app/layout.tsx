import { NetworkStatusProvider } from '@/context/NetworkStatusContext';

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
        <body className="antialiased">
          {children}
        </body>
      </html>
    </NetworkStatusProvider>
  );
}