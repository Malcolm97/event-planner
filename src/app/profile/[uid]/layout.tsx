import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// Generate dynamic metadata for profile pages
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ uid: string }> 
}): Promise<Metadata> {
  try {
    const { uid } = await params;
    const supabase = await createServerSupabaseClient();
    
    // Fetch user data for metadata
    const { data: user } = await supabase
      .from('profiles')
      .select('full_name, company, about, avatar_url')
      .eq('id', uid)
      .single();

    if (!user) {
      return {
        title: 'Creator Not Found | PNG Events',
        description: 'The requested creator profile could not be found.',
      };
    }

    const name = user.full_name || 'Event Creator';
    const title = `${name} | Event Creator Profile | PNG Events`;
    const description = user.about 
      ? `${user.about.slice(0, 150)}${user.about.length > 150 ? '...' : ''}`
      : `View ${name}'s profile on PNG Events. ${user.company ? `Organizer at ${user.company}.` : ''} Discover their events and get in touch.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'profile',
        images: user.avatar_url ? [
          {
            url: user.avatar_url,
            width: 400,
            height: 400,
            alt: `${name}'s profile picture`,
          },
        ] : [],
        siteName: 'PNG Events',
      },
      twitter: {
        card: 'summary',
        title,
        description,
        images: user.avatar_url ? [user.avatar_url] : [],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    return {
      title: 'Creator Profile | PNG Events',
      description: 'View event creator profiles on PNG Events.',
    };
  }
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}