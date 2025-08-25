'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase, TABLES, Event, User } from '@/lib/supabase';
import Header from '@/components/Header';
import EventModal from '@/components/EventModal';
import { FiMapPin, FiCalendar, FiClock, FiShare2, FiLink, FiStar, FiMusic, FiImage, FiCoffee, FiCpu, FiHeart, FiSmile } from 'react-icons/fi';

// Category and Icon mapping (copied from EventsPage for consistency)
const categoryIconMap: { [key: string]: any } = {
  'Music': FiMusic,
  'Art': FiImage,
  'Food': FiCoffee,
  'Technology': FiCpu,
  'Wellness': FiHeart,
  'Comedy': FiSmile,
  'Other': FiSmile, // Default for 'Other'
};

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false); // State to control modal visibility

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from(TABLES.EVENTS)
          .select('id, name, date, location, venue, category, presale_price, gate_price, image_url, featured, created_by, description, created_at')
          .eq('id', eventId)
          .single();

        if (error) {
          console.error('Error fetching event:', error);
          setEvent(null);
          return;
        }

        setEvent(data || null);
        if (data?.created_by) {
          fetchHost(data.created_by);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const fetchHost = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching host:', error.message || error);
        setHost(null);
        return;
      }
      setHost(data || null);
    } catch (err: any) {
      console.error('Error fetching host:', err.message || err);
      setHost(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Header />
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
        <p className="text-gray-500 mt-6 text-lg">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Header />
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
        <p className="text-gray-600">The event you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* This page will primarily serve to open the modal directly */}
        {/* The EventModal component will handle displaying the event details */}
        {/* We can trigger the modal to open immediately on page load */}
        {/* For a direct page view, you would render the event details here */}
        {/* For now, we'll just open the modal */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {event.name}
          </h1>
          <p className="text-gray-600">Loading event details in a modal...</p>
          {/* Automatically open the modal when the event data is loaded */}
          <button 
            onClick={() => setDialogOpen(true)} 
            className="mt-4 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            View Event Details
          </button>
        </div>
      </div>

      {event && (
        <EventModal 
          selectedEvent={event} 
          host={host} 
          dialogOpen={true} // Always open when this page is loaded
          setDialogOpen={setDialogOpen} 
        />
      )}

      {/* Footer */}
      <footer className="w-full py-8 px-4 sm:px-8 bg-black border-t border-red-600 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
          <div className="flex gap-6 mb-2 md:mb-0">
            <a href="/events" className="hover:text-yellow-300 text-white">Events</a>
            <a href="/categories" className="hover:text-yellow-300 text-white">Categories</a>
            <a href="/about" className="hover:text-yellow-300 text-white">About</a>
          </div>
          <div className="text-center text-white">© 2025 PNG Events. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-yellow-300 text-white">Terms</a>
            <a href="#" className="hover:text-yellow-300 text-white">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
