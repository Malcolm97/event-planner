'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OnlineBadge from '@/components/OnlineBadge';
import OfflineIndicator from '@/components/OfflineIndicator';
import UpdatePrompt from '@/components/UpdatePrompt';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  // Don't render main layout components on admin pages
  if (isAdminPage) {
    return (
      <>
        <OfflineIndicator />
        <main id="main-content" role="main" className="min-h-screen">
          {children}
        </main>
      </>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <Header />
      <main id="main-content" role="main" className="pb-16 sm:pb-20 md:pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>
      <BottomNav />
      <PWAInstallPrompt />
      <OnlineBadge />
      <UpdatePrompt />
    </>
  );
}