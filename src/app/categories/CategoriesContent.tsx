'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, TABLES, User } from '@/lib/supabase';
import { EventItem } from '../../lib/types';
import { useEvents } from '@/hooks/useOfflineFirstData';
import EventCard from '@/components/EventCard';
import { FiStar, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile } from 'react-icons/fi';
import EventModal from '@/components/EventModal';
import Link from 'next/link';
import { isEventUpcomingOrActive } from '@/lib/utils';

const allCategories = [
  { name: 'All Categories', icon: 'FiStar', color: 'bg-gray-200 text-gray-800' },
  { name: 'Music', icon: 'FiMusic', color: 'bg-purple-100 text-purple-600' },
  { name: 'Art', icon: 'FiImage', color: 'bg-pink-100 text-pink-600' },
  { name: 'Food', icon: 'FiCoffee', color: 'bg-orange-100 text-orange-600' },
  { name: 'Technology', icon: 'FiCpu', color: 'bg-blue-100 text-blue-600' },
  { name: 'Wellness', icon: 'FiHeart', color: 'bg-green-100 text-green-600' },
  { name: 'Comedy', icon: 'FiSmile', color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Other', icon: 'FiStar', color: 'bg-gray-100 text-gray-600' },
];

const categoryIconMap: { [key: string]: React.ElementType } = {
  'FiStar': FiStar,
  'FiMusic': FiMusic,
  'FiImage': FiImage,
  'FiCoffee': FiCoffee,
  'FiCpu': FiCpu,
  'FiHeart': FiHeart,
  'FiSmile': FiSmile,
};

interface CategoriesContentProps {
  initialEvents: EventItem[];
}

export default function CategoriesContent({ initialEvents }: CategoriesContentProps) {
  const searchParams = useSearchParams();
  const queryCategory = searchParams.get('category');
  const { data: events = [], isLoading: loading } = useEvents(queryCategory || undefined);
  
  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [host, setHost] = useState<User | null>(null);
  
  const selectedCategoryInfo = allCategories.find(cat => cat.name === queryCategory) || allCategories[0];
  const Icon = categoryIconMap[selectedCategoryInfo.icon];

  // Fetch host details when an event is selected
  const fetchHost = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId);

      if (error) throw error;
      if (data && data.length > 0) {
        setHost(data[0]);
      }
    } catch (error) {
      console.error('Error fetching host:', error);
    }
  };

  // Effect to fetch host details when selectedEvent changes
  useEffect(() => {
    if (selectedEvent?.created_by) {
      fetchHost(selectedEvent.created_by);
    } else {
      setHost(null);
    }
  }, [selectedEvent]);

  // Use memoized filtering with proper event timing logic
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (!queryCategory || queryCategory === 'All Categories') return true;
      return event.category === queryCategory;
    });
  }, [events, queryCategory]);

  // Use the improved timing function to filter events
  // Events are considered "upcoming" if they haven't ended yet
  const upcomingEvents = useMemo(() => {
    return filteredEvents.filter(event => isEventUpcomingOrActive(event));
  }, [filteredEvents]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Icon className="w-8 h-8 text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            {queryCategory || 'All Events'}
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          {queryCategory
            ? `Discover amazing ${queryCategory.toLowerCase()} events happening near you`
            : 'Browse all events by category'}
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-12">
        {allCategories.map(cat => {
          const CategoryIcon = categoryIconMap[cat.icon];
          const eventsInCategory = events.filter(event => !cat.name || cat.name === 'All Categories' || event.category === cat.name);
          // Use the improved timing function for active/upcoming events
          const upcomingInCategory = eventsInCategory.filter(event => isEventUpcomingOrActive(event));

          return (
            <Link
              key={cat.name}
              href={`/categories?category=${encodeURIComponent(cat.name)}`}
              className={`
                flex flex-col items-center justify-center gap-2 md:gap-3 p-3 md:p-6 rounded-xl md:rounded-2xl 
                transition duration-200 ease-in-out transform hover:scale-105
                ${cat.color}
                ${cat.name === queryCategory ? 'ring-2 ring-yellow-400 shadow-lg' : ''}
              `}
            >
              <CategoryIcon className="w-5 h-5 md:w-8 md:h-8" />
              <div className="text-center">
                <h3 className="font-medium md:font-semibold text-xs md:text-base">{cat.name}</h3>
                <p className="text-xs md:text-sm">{upcomingInCategory.length} upcoming</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Events List */}
      {upcomingEvents.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => {
                  setSelectedEvent(event);
                  if (event.created_by) fetchHost(event.created_by);
                  setDialogOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Events Message */}
      {!upcomingEvents.length && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">
            {queryCategory ? `No ${queryCategory.toLowerCase()} events found` : 'No events found'}
          </p>
        </div>
      )}

      {/* Event Modal */}
      {selectedEvent && (
        <EventModal
          selectedEvent={selectedEvent}
          host={host}
          dialogOpen={dialogOpen}
          setDialogOpen={(open) => {
            setDialogOpen(open);
            if (!open) {
              setSelectedEvent(null);
              setHost(null);
            }
          }}
        />
      )}
    </div>
  );
}
