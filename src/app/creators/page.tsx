'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import AppFooter from '@/components/AppFooter';
import { supabase, TABLES, User } from '@/lib/supabase';
import { FiSearch, FiUser } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import CreatorModal from '@/components/CreatorModal';
import { useOfflineFirstData } from '@/hooks/useOfflineFirstData';
import { useNetworkStatus } from '@/context/NetworkStatusContext';

// Base64 encoded SVG for a default user avatar
const DEFAULT_AVATAR_SVG_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5YTNhZiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz4KICA8cGF0aCBkPSJNMTIgMTRjLTQuNDE4IDAtOCAyLjIzOS04IDV2MWgxNnYtMWMwLTIuNzYxLTMuNTgyLTUtOC01eiIvPgo8L3N2Zz4=`;

interface CreatorWithEvents extends User {
  eventsCount: number;
  latestEvent?: any;
}

export default function CreatorsPage() {
  const searchParams = useSearchParams();
  const { isOnline } = useNetworkStatus();
  const { data: users = [], isLoading: usersLoading } = useOfflineFirstData<User>(TABLES.USERS);
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

        // Filter users to only creators
        const creatorsData = users.filter(user => creatorIds.includes(user.id));

        // Add event data to creators
        const creatorsWithData = creatorsData.map(creator => {
          const creatorEvents = events.filter((event: any) => event.created_by === creator.id);
          const eventsCount = creatorEvents.length;
          const latestEvent = creatorEvents.find((event: any) =>
            event.date && new Date(event.date) >= new Date()
          );

          return {
            ...creator,
            eventsCount,
            latestEvent
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

  // Filter creators based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCreators(creators);
      return;
    }

    const filtered = creators.filter(creator =>
      creator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.about?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredCreators(filtered);
  }, [creators, searchTerm]);

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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero Section */}
      <section className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-yellow-300 to-red-600 border-b border-black">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {filteredCreators.map((creator) => (
                <div
                  key={creator.id}
                  onClick={() => handleCreatorClick(creator)}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-yellow-300 group p-4"
                >
                  <div className="text-center">
                    {/* Profile Picture */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                      {creator.photo_url ? (
                        <Image
                          src={creator.photo_url}
                          alt={creator.name || 'Creator'}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={DEFAULT_AVATAR_SVG_BASE64}
                          alt="Default avatar"
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 group-hover:text-yellow-600 transition-colors">
                      {creator.name || 'Unnamed Creator'}
                    </h3>

                    {/* Bio */}
                    {creator.about && (
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
                        {creator.about}
                      </p>
                    )}

                    {/* Events Count */}
                    <div className="mt-2 text-xs text-yellow-600">
                      {creator.eventsCount} event{creator.eventsCount !== 1 ? 's' : ''}
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
