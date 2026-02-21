"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TABLES, Event, User } from '@/lib/supabase';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiBriefcase, FiMessageCircle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import AppFooter from '@/components/AppFooter';
import DashboardEventsSection from '@/components/DashboardEventsSection';
import { isEventUpcomingOrActive } from '@/lib/utils';
import { EventItem } from '@/lib/types';
import { getWhatsAppUrl, sanitizeUrl } from '@/lib/thirdPartyUtils';

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

  // Use proper timing logic - event is upcoming/current if it hasn't ended yet
  const upcomingEvents = userEvents.filter(event => isEventUpcomingOrActive(event as EventItem));
  const previousEvents = userEvents.filter(event => !isEventUpcomingOrActive(event as EventItem));

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
                      href={getWhatsAppUrl(user.whatsapp_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      <FaWhatsapp size={18} className="text-green-600" />
                      <div>
                        <p className="text-xs text-green-600 font-medium uppercase tracking-wide">WhatsApp</p>
                        <p className="text-green-800 font-medium">{user.whatsapp_number}</p>
                      </div>
                    </a>
                  )}
                </div>
              )}

              {/* Social Links */}
              {user.show_social_links !== false && user.social_links && Object.keys(user.social_links).length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Social Links</h3>
                  <div className="flex gap-3">
                    {user.social_links.facebook && (
                      <a
                        href={user.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all duration-200 hover:scale-105"
                        aria-label="Facebook"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C23.027 19.612 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                    )}
                    {user.social_links.instagram && (
                      <a
                        href={user.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center hover:scale-105 transition-all duration-200"
                        aria-label="Instagram"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}
                    {user.social_links.tiktok && (
                      <a
                        href={user.social_links.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center hover:bg-gray-800 hover:scale-105 transition-all duration-200"
                        aria-label="TikTok"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      </a>
                    )}
                    {user.social_links.twitter && (
                      <a
                        href={user.social_links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-black hover:scale-105 transition-all duration-200"
                        aria-label="Twitter/X"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                  </div>
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
