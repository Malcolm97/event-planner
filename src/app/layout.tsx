import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PNG Events - Discover Local Events",
  description: "Find and create amazing events in Papua New Guinea",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<html lang="en">
  <link rel="manifest" href="/manifest.json" />
      <body className="antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then((registration) => {
                      console.log('Service worker registered with scope:', registration.scope);
                    })
                    .catch((error) => {
                      console.error('Service worker registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
