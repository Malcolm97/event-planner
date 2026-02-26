"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TABLES, Event, User } from '@/lib/supabase';
import { normalizeUser } from '@/lib/types';
import { isEventUpcomingOrActive } from '@/lib/utils';
import { EventItem } from '@/lib/types';
import AppFooter from '@/components/AppFooter';
import DashboardEventsSection from '@/components/DashboardEventsSection';
import ProfileSkeleton from '@/components/ProfileSkeleton';
import ProfileHeader from '@/components/ProfileHeader';
import FeaturedEventsSection from '@/components/FeaturedEventsSection';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function ProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string>('');

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setUid(resolvedParams.uid);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!uid) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('id', uid)
          .single();
          
        if (userError || !userData) {
          setError('User not found');
          setUser(null);
          setUserEvents([]);
          setLoading(false);
          return;
        }
        
        // Normalize user data to handle field name variants (full_name/name, avatar_url/photo_url)
        const normalizedUser = normalizeUser(userData);
        setUser(normalizedUser);
        
        // Fetch user's events
        const { data: eventsData, error: eventsError } = await supabase
          .from(TABLES.EVENTS)
          .select('*')
          .eq('created_by', uid)
          .order('date', { ascending: true });
          
        if (eventsError) {
          console.warn('Error fetching events:', eventsError);
        }
        
        setUserEvents(eventsData || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
        setUser(null);
        setUserEvents([]);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [uid]);

  // Restore scroll position when component mounts
  useEffect(() => {
    const scrollPosition = sessionStorage.getItem('creatorsScrollPosition');
    if (scrollPosition) {
      window.scrollTo(0, parseInt(scrollPosition, 10));
      sessionStorage.removeItem('creatorsScrollPosition');
    }
  }, []);

  const handleBackToCreators = () => {
    router.push('/creators');
  };

  // Memoized event calculations
  const { upcomingEvents, previousEvents, featuredEvents } = useMemo(() => {
    const upcoming = userEvents.filter(event => isEventUpcomingOrActive(event as EventItem));
    const previous = userEvents.filter(event => !isEventUpcomingOrActive(event as EventItem));
    
    // Featured events are upcoming events sorted by date (nearest first)
    const featured = [...upcoming].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : Infinity;
      const dateB = b.date ? new Date(b.date).getTime() : Infinity;
      return dateA - dateB;
    });
    
    return {
      upcomingEvents: upcoming,
      previousEvents: previous,
      featuredEvents: featured,
    };
  }, [userEvents]);

  // Loading state with skeleton
  if (loading) {
    return <ProfileSkeleton />;
  }

  // Error state
  if (error || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <FiUser size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {error || 'User not found'}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            The profile you're looking for doesn't exist or may have been removed.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
            >
              Retry
            </button>
            <button
              onClick={handleBackToCreators}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Browse Creators
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Profile Header with Share functionality */}
      <ProfileHeader
        user={user}
        eventsCount={userEvents.length}
        upcomingCount={upcomingEvents.length}
        onBack={handleBackToCreators}
        isVerified={user.role === 'verified' || user.role === 'admin'}
      />

      <div className="max-w-5xl mx-auto px-4 pb-6">
        {/* Featured Events Section - Only show if there are upcoming events */}
        {featuredEvents.length > 0 && (
          <div className="mb-6">
            <FeaturedEventsSection events={featuredEvents} maxVisible={3} />
          </div>
        )}

        {/* Events Sections - Full Width */}
        <div className="space-y-6" id="all-events">
          {/* Current Events */}
          <DashboardEventsSection
            title="Current Events"
            events={upcomingEvents}
            icon={FiCalendar}
            emptyState={{
              emoji: "📅",
              title: "No upcoming events",
              description: "This creator doesn't have any upcoming events scheduled.",
            }}
            loading={loading}
            sectionType="upcoming"
          />

          {/* Previous Events */}
          <DashboardEventsSection
            title="Previous Events"
            events={previousEvents}
            icon={FiClock}
            emptyState={{
              emoji: "🎉",
              title: "No previous events",
              description: "This creator hasn't organized any past events yet.",
            }}
            loading={loading}
            collapsible={true}
            defaultExpanded={false}
            maxVisible={3}
            sectionType="previous"
          />
        </div>
      </div>

      <AppFooter />
    </div>
  );
}