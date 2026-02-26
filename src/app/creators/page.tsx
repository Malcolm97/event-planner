'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import AppFooter from '@/components/AppFooter';
import { supabase, TABLES, User } from '@/lib/supabase';
import { normalizeUser } from '@/lib/types';
import { FiSearch, FiUser, FiCalendar, FiMapPin, FiClock } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import CreatorModal from '@/components/CreatorModal';
import { useOfflineFirstData } from '@/hooks/useOfflineFirstData';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { isEventUpcomingOrActive } from '@/lib/utils';

// Base64 encoded SVG for a default user avatar
const DEFAULT_AVATAR_SVG_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIjk5YTNhZiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz4KICA8cGF0aCBkPSJNMTIgMTRjLTQuNDE4IDAtOCAyLjIzOS04IDV2MWgxNnYtMWMwLTIuNzYxLTMuNTgyLTUtOC01eiIvPgo8L3N2Zz4=`;

// Default placeholder image for events
const DEFAULT_EVENT_IMAGE = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNlN2U3ZTciLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM5Y2EzYWYiPkV2ZW50PC90ZXh0Pjwvc3ZnPg==`;

interface CreatorWithEvents extends User {
  eventsCount: number;
  latestEvent?: any;
  allEvents?: any[];
  hasUpcomingEvent?: boolean;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export default function CreatorsPage() {
  const searchParams = useSearchParams();
  const { isOnline } = useNetworkStatus();
  // Use 'creators' endpoint which is a public API that doesn't require admin auth
  const { data: users = [], isLoading: usersLoading } = useOfflineFirstData<User>('creators');
  const { data: events = [] } = useOfflineFirstData(TABLES.EVENTS);
  const [creators, setCreators] = useState<CreatorWithEvents[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<CreatorWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<CreatorWithEvents | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Process creators data from cached users and events
  useEffect(() => {
    if (usersLoading) return;

    const processCreators = async () => {
      try {
        setLoading(true);

        // Get all users who have created events
        const creatorIds = [...new Set(events.map((event: any) => event.created_by).filter(Boolean))];

        if (creatorIds.length === 0) {
          setCreators([]);
          setFilteredCreators([]);
          setLoading(false);
          return;
        }

        // Filter users to only creators and normalize their data
        const creatorsData = users
          .filter(user => creatorIds.includes(user.id))
          .map(user => normalizeUser(user));

        // Add event data to creators
        const creatorsWithData = creatorsData.map(creator => {
          const creatorEvents = events.filter((event: any) => event.created_by === creator.id);
          const eventsCount = creatorEvents.length;
          // Use proper timing logic - event is upcoming/current if it hasn't ended yet
          const upcomingEvents = creatorEvents.filter((event: any) =>
            isEventUpcomingOrActive(event)
          );
          const latestEvent = upcomingEvents[0] || creatorEvents[0];
          const hasUpcomingEvent = upcomingEvents.length > 0;

          return {
            ...creator,
            eventsCount,
            latestEvent,
            allEvents: creatorEvents,
            hasUpcomingEvent
          };
        });

        setCreators(creatorsWithData);
        setFilteredCreators(creatorsWithData);
      } catch (error) {
        console.error('Error processing creators:', error);
      } finally {
        setLoading(false);
      }
    };

    processCreators();
  }, [users, events, usersLoading]);

  // Memoized filtered creators list with proper dependency array
  const filteredCreatorsList = useMemo(() => {
    if (!searchTerm) return creators;
    
    const searchLower = searchTerm.toLowerCase();
    return creators.filter(creator =>
      creator.name?.toLowerCase().includes(searchLower) ||
      creator.company?.toLowerCase().includes(searchLower) ||
      creator.about?.toLowerCase().includes(searchLower)
    );
  }, [creators, searchTerm]);

  // Sync memoized result to state for rendering
  useEffect(() => {
    setFilteredCreators(filteredCreatorsList);
  }, [filteredCreatorsList]);

  // Check for modal state in URL parameters (after sign-in redirect)
  useEffect(() => {
    const modalStateParam = searchParams.get('modalState');
    if (modalStateParam && creators.length > 0) {
      try {
        const modalState = JSON.parse(modalStateParam);
        if (modalState.type === 'creator-modal' && modalState.creatorId) {
          const creator = creators.find(c => c.id === modalState.creatorId);
          if (creator) {
            setSelectedCreator(creator);
            setModalOpen(true);
            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete('modalState');
            window.history.replaceState({}, '', url.toString());
          }
        }
      } catch (error) {
        console.error('Error parsing modal state:', error);
      }
    }
  }, [searchParams, creators]);

  const handleCreatorClick = (creator: CreatorWithEvents) => {
    setSelectedCreator(creator);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <section className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-yellow-300 to-red-600 border-b border-black dark:border-gray-700">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-base sm:text-base lg:text-2xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight">
            Event Creators
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed mb-8">
            Discover talented event creators and organizers in Papua New Guinea. Connect with the people behind amazing events.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 text-base border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-white focus:border-white transition-all duration-200 placeholder-gray-500 shadow-lg"
              />
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* Creators Grid */}
      <section className="max-w-7xl mx-auto w-full py-12 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg">Loading creators...</p>
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No creators found' : 'No creators available'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Check back later for event creators.'}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <p className="text-gray-600">
                Showing {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''}
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {filteredCreators.map((creator) => (
                <div
                  key={creator.id}
                  onClick={() => handleCreatorClick(creator)}
                  className="bg-white rounded-2xl lg:rounded-3xl shadow-md hover:shadow-xl lg:hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-yellow-400 group p-5 sm:p-6 lg:p-7 xl:p-8 transform hover:scale-[1.02] lg:hover:scale-[1.03]"
                >
                  <div className="text-center">
                    {/* Profile Picture with Status Indicator */}
                    <div className="relative inline-block mb-4 lg:mb-5">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 rounded-xl lg:rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto overflow-hidden shadow-md lg:shadow-lg border-4 border-white">
                        {creator.photo_url ? (
                          <Image
                            src={creator.photo_url}
                            alt={creator.name || 'Creator'}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image
                            src={DEFAULT_AVATAR_SVG_BASE64}
                            alt="Default avatar"
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      {/* Status Indicator - Green dot for upcoming events */}
                      {creator.hasUpcomingEvent && (
                        <div className="absolute bottom-1 right-1 sm:bottom-1 sm:right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm" title="Has upcoming events"></div>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg lg:text-xl mb-2 group-hover:text-yellow-600 transition-colors">
                      {creator.name || 'Unnamed Creator'}
                    </h3>

                    {/* Company */}
                    {creator.company && (
                      <p className="text-gray-500 text-sm lg:text-base mb-2 truncate px-2">
                        {creator.company}
                      </p>
                    )}

                    {/* Bio */}
                    {creator.about && (
                      <p className="text-gray-600 text-sm lg:text-base leading-relaxed line-clamp-2 mb-3">
                        {creator.about}
                      </p>
                    )}

                    {/* Event Preview Thumbnail */}
                    {creator.latestEvent && creator.latestEvent.image_url && (
                      <div className="relative h-24 lg:h-28 w-full rounded-lg overflow-hidden mb-3 shadow-sm">
                        <Image
                          src={creator.latestEvent.image_url}
                          alt={creator.latestEvent.name || 'Event'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium truncate">
                          {creator.latestEvent.name}
                        </div>
                      </div>
                    )}

                    {/* Quick Stats Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-full shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                        <FiCalendar size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {creator.eventsCount} event{creator.eventsCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Creator Modal */}
      <CreatorModal
        creator={selectedCreator}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      <AppFooter />
    </div>
  );
}
