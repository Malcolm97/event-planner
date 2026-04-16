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
        <main id="main-content" role="main" className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <Header />
      <main id="main-content" role="main" className="min-h-screen bg-gray-50 pb-[5.25rem] sm:pb-24 md:pb-6 lg:pb-0 dark:bg-gray-900 transition-colors duration-300">
        {children}
      </main>
      <BottomNav />
      <PWAInstallPrompt />
      <OnlineBadge />
      <UpdatePrompt />
    </>
  );
}
