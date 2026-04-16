'use client';

import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useSearchParams } from 'next/navigation';
import AppFooter from '@/components/AppFooter';
import { User } from '@/lib/supabase';
import { FiSearch, FiCalendar } from 'react-icons/fi';
import Image from 'next/image';
import CreatorModal from '@/components/CreatorModal';
import { useOfflineFirstData } from '@/hooks/useOfflineFirstData';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { reportClientTelemetry } from '@/lib/clientTelemetry';

// Base64 encoded SVG for a default user avatar
const DEFAULT_AVATAR_SVG_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIjk5YTNhZiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz4KICA8cGF0aCBkPSJNMTIgMTRjLTQuNDE4IDAtOCAyLjIzOS04IDV2MWgxNnYtMWMwLTIuNzYxLTMuNTgyLTUtOC01eiIvPgo8L3N2Zz4=`;

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
  const { data: creatorsData = [], isLoading: usersLoading } = useOfflineFirstData<CreatorWithEvents>('creators');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedCreator, setSelectedCreator] = useState<CreatorWithEvents | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const creators = useMemo<CreatorWithEvents[]>(() => {
    if (usersLoading || creatorsData.length === 0) {
      return [];
    }

    return creatorsData
      .filter((creator) => (creator.eventsCount || 0) > 0)
      .sort((a, b) => {
        if (a.hasUpcomingEvent !== b.hasUpcomingEvent) {
          return a.hasUpcomingEvent ? -1 : 1;
        }
        if (a.eventsCount !== b.eventsCount) {
          return b.eventsCount - a.eventsCount;
        }
        return (a.name || '').localeCompare(b.name || '');
        });
      }, [creatorsData, usersLoading]);

  const loading = usersLoading;

  const filteredCreators = useMemo(() => {
    if (!deferredSearchTerm) return creators;
    
    const searchLower = deferredSearchTerm.toLowerCase();
    return creators.filter(creator =>
      creator.name?.toLowerCase().includes(searchLower) ||
      creator.company?.toLowerCase().includes(searchLower) ||
      creator.about?.toLowerCase().includes(searchLower)
    );
  }, [creators, deferredSearchTerm]);

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
        reportClientTelemetry({
          route: '/creators',
          category: 'warning',
          message: 'Failed to parse creator modal state',
          details: {
            modalStateParam,
            error: error instanceof Error ? error.message : 'Unknown parse error',
          },
        });
      }
    }
  }, [searchParams, creators]);

  useEffect(() => {
    if (usersLoading || !isOnline) return;
    if (creatorsData.length > 0) return;

    reportClientTelemetry({
      route: '/creators',
      category: 'info',
      message: 'Creators page returned no creator records while online',
      details: {
        creatorsDataLength: creatorsData.length,
      },
    });
  }, [creatorsData.length, isOnline, usersLoading]);

  const handleCreatorClick = (creator: CreatorWithEvents) => {
    setSelectedCreator(creator);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <section className="w-full border-b border-black bg-gradient-to-br from-yellow-300 to-red-600 py-12 sm:py-16 lg:py-20 dark:border-gray-700">
        <div className="page-shell max-w-5xl text-center">
          <h1 className="page-title text-white mb-4 sm:mb-6">
            Event Creators
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed mb-8">
            Discover talented event creators and organizers in Papua New Guinea. Connect with the people behind amazing events.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-md mx-auto">
            <div className="relative">
              <label htmlFor="creator-search" className="sr-only">
                Search creators by name, company, or bio
              </label>
              <input
                type="text"
                id="creator-search"
                aria-label="Search creators"
                placeholder="Search creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 text-base border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-white focus:border-white transition-all duration-200 placeholder-gray-500 shadow-lg"
              />
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-800 px-2 py-1 rounded-md hover:bg-gray-100"
                  aria-label="Clear creator search"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Creators Grid */}
      <section className="w-full py-12">
        <div className="page-shell">
        {loading ? (
          <div className="py-6 sm:py-8" role="status" aria-live="polite" aria-label="Loading creators">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 lg:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`creator-skeleton-${index}`}
                  className="bg-white rounded-2xl lg:rounded-3xl border border-gray-200 p-5 sm:p-6 lg:p-7 xl:p-8 animate-pulse"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 rounded-xl lg:rounded-2xl bg-gray-200 mx-auto mb-4 lg:mb-5" />
                    <div className="h-5 sm:h-6 bg-gray-200 rounded-lg w-3/4 mx-auto mb-3" />
                    <div className="h-4 bg-gray-100 rounded-lg w-2/3 mx-auto mb-2" />
                    <div className="h-4 bg-gray-100 rounded-lg w-1/2 mx-auto mb-4" />
                    <div className="h-24 lg:h-28 w-full bg-gray-100 rounded-lg mb-3" />
                    <div className="h-8 bg-gray-200 rounded-full w-28 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4" aria-hidden="true">👥</div>
            <span className="sr-only">No creators found</span>
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
              <p className="text-gray-600" aria-live="polite">
                Showing {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''}
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 lg:gap-6">
              {filteredCreators.map((creator) => (
                <button
                  type="button"
                  key={creator.id}
                  onClick={() => handleCreatorClick(creator)}
                  className="bg-white rounded-2xl lg:rounded-3xl shadow-md hover:shadow-xl lg:hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-yellow-400 group p-5 sm:p-6 lg:p-7 xl:p-8 transform hover:scale-[1.02] lg:hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 text-left"
                  aria-label={`View ${creator.name || 'creator'} profile with ${creator.eventsCount} events`}
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
                            loading="lazy"
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
                        <>
                          <div className="absolute bottom-1 right-1 sm:bottom-1 sm:right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm" title="Has upcoming events"></div>
                          <span className="sr-only">Has upcoming events</span>
                        </>
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
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 320px"
                          quality={75}
                          loading="lazy"
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
                </button>
              ))}
            </div>
          </>
        )}
        </div>
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
