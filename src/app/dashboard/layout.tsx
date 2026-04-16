import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | PNG Events',
  description: 'Manage your events, profile, and saved activities on PNG Events.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
