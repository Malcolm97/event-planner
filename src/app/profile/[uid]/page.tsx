"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, TABLES, Event, User } from '@/lib/supabase';
import { normalizeUser } from '@/lib/types';
import { isEventUpcomingOrActive } from '@/lib/utils';
import { EventItem } from '@/lib/types';
import { reportClientTelemetry } from '@/lib/clientTelemetry';
import AppFooter from '@/components/AppFooter';
import DashboardEventsSection from '@/components/DashboardEventsSection';
import ProfileSkeleton from '@/components/ProfileSkeleton';
import ProfileHeader from '@/components/ProfileHeader';
import FeaturedEventsSection from '@/components/FeaturedEventsSection';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams<{ uid: string }>();
  const uid = Array.isArray(params?.uid) ? params.uid[0] : (params?.uid ?? '');
  const [user, setUser] = useState<User | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (uid) return;
    setError('Invalid creator profile link');
    setLoading(false);
    reportClientTelemetry({
      route: '/profile/[uid]',
      category: 'warning',
      message: 'Profile page loaded without a uid route parameter',
    });
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    let isActive = true;

    const fetchUserData = async () => {
      try {
        if (isActive) {
          setLoading(true);
          setError(null);
        }
        
        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('id', uid)
          .single();
          
        if (userError || !userData) {
          if (isActive) {
            setError('User not found');
            setUser(null);
            setUserEvents([]);
            setLoading(false);
          }

          reportClientTelemetry({
            route: '/profile/[uid]',
            category: 'warning',
            message: 'Creator profile not found',
            details: {
              uid,
              code: userError?.code,
              message: userError?.message,
            },
          });
          return;
        }
        
        // Normalize user data to handle field name variants (full_name/name, avatar_url/photo_url)
        const normalizedUser = normalizeUser(userData);
        if (isActive) {
          setUser(normalizedUser);
        }
        
        // Fetch user's events
        const { data: eventsData, error: eventsError } = await supabase
          .from(TABLES.EVENTS)
          .select('*')
          .eq('created_by', uid)
          .order('date', { ascending: true });
          
        if (eventsError) {
          console.warn('Error fetching events:', eventsError);
        }
        
        if (isActive) {
          setUserEvents(eventsData || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (isActive) {
          setError('Failed to load profile');
          setUser(null);
          setUserEvents([]);
          setLoading(false);
        }

        reportClientTelemetry({
          route: '/profile/[uid]',
          category: 'error',
          message: 'Profile data fetch failed',
          details: {
            uid,
            error: err instanceof Error ? err.message : 'Unknown fetch error',
          },
        });
      }
    };
    
    fetchUserData();

    return () => {
      isActive = false;
    };
  }, [uid]);

  // Restore scroll position when component mounts
  useEffect(() => {
    const scrollPosition = sessionStorage.getItem('creatorsScrollPosition');
    if (scrollPosition) {
      const y = parseInt(scrollPosition, 10);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, y);
        });
      });
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
              className="touch-target px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors text-sm font-medium"
            >
              Retry
            </button>
            <button
              onClick={handleBackToCreators}
              className="touch-target px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
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