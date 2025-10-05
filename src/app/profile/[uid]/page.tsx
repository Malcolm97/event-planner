"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TABLES, Event, User } from '@/lib/supabase';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiBriefcase, FiMessageCircle } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import AppFooter from '@/components/AppFooter';
import DashboardEventsSection from '@/components/DashboardEventsSection';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

// Base64 encoded SVG for a default user avatar
const DEFAULT_AVATAR_SVG_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5YTNhZiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz4KICA8cGF0aCBkPSJNMTIgMTRjLTQuNDE4IDAtOCAyLjIzOS04IDV2MWgxNnYtMWMwLTIuNzYxLTMuNTgyLTUtOC01eiIvPgo8L3N2Zz4=`;

export default function ProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
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
        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('id', uid)
          .single();
        if (userError || !userData) {
          setUser(null);
          setUserEvents([]);
          setLoading(false);
          return;
        }
        setUser(userData);
        const { data: eventsData } = await supabase
          .from(TABLES.EVENTS)
          .select('*')
          .eq('created_by', uid)
          .order('date', { ascending: true });
        setUserEvents(eventsData || []);
        setLoading(false);
      } catch (err) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-500 mt-6 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">User not found</h3>
          <p className="text-gray-500">The user profile you're looking for doesn't exist.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const upcomingEvents = userEvents.filter(event => new Date(event.date) >= new Date());
  const previousEvents = userEvents.filter(event => new Date(event.date) < new Date());

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <button
              onClick={handleBackToCreators}
              className="inline-flex items-center gap-2 text-gray-900 hover:text-yellow-600 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
            >
              <FiArrowLeft size={16} />
              Back to Creators
            </button>
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Event Creator Profile</h1>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <div className="card p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden shadow-lg border-4 border-white">
                {user.photo_url ? (
                  <Image
                    src={user.photo_url}
                    alt={user.name || 'Creator'}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={DEFAULT_AVATAR_SVG_BASE64}
                    alt="Default avatar"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {user.name || 'Unnamed Creator'}
              </h2>

              {user.company && (
                <div className="flex items-center gap-2 mb-3">
                  <FiBriefcase size={18} className="text-gray-500" />
                  <span className="text-lg text-gray-700 font-medium">{user.company}</span>
                </div>
              )}

              <div className="text-gray-600 mb-4">
                {userEvents.length} event{userEvents.length !== 1 ? 's' : ''} created
              </div>

              {/* Contact Information */}
              {user.contact_visibility && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(user.contact_method === 'email' || user.contact_method === 'both') && user.email && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <FiMail size={18} className="text-blue-600" />
                      <div>
                        <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Email</p>
                        <p className="text-blue-800 font-medium">{user.email}</p>
                      </div>
                    </div>
                  )}

                  {(user.contact_method === 'phone' || user.contact_method === 'both') && user.phone && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <FiPhone size={18} className="text-green-600" />
                      <div>
                        <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Phone</p>
                        <p className="text-green-800 font-medium">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  {user.whatsapp_number && (
                    <a
                      href={`https://wa.me/${user.whatsapp_number.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      <FiMessageCircle size={18} className="text-green-600" />
                      <div>
                        <p className="text-xs text-green-600 font-medium uppercase tracking-wide">WhatsApp</p>
                        <p className="text-green-800 font-medium">{user.whatsapp_number}</p>
                      </div>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.about && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
              <p className="text-gray-700 leading-relaxed text-base">{user.about}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Events</span>
                  <span className="font-semibold text-gray-900">{userEvents.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Upcoming Events</span>
                  <span className="font-semibold text-green-600">{upcomingEvents.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Past Events</span>
                  <span className="font-semibold text-gray-500">{previousEvents.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Events */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Events */}
            <DashboardEventsSection
              title="Current Events"
              events={upcomingEvents}
              icon={FiUser}
              emptyState={{
                emoji: "📅",
                title: "No upcoming events",
                description: "This creator doesn't have any upcoming events.",
              }}
              loading={loading}
            />

            {/* Previous Events */}
            <DashboardEventsSection
              title="Previous Events"
              events={previousEvents}
              icon={FiUser}
              emptyState={{
                emoji: "🎉",
                title: "No previous events",
                description: "This creator hasn't organized any past events yet.",
              }}
              loading={loading}
              collapsible={true}
              defaultExpanded={false}
              maxVisible={3}
            />
          </div>
        </div>
      </div>

      <AppFooter />
    </div>
  );
}
