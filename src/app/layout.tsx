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
      <body className="antialiased">{children}</body>
    </html>
  );
}
