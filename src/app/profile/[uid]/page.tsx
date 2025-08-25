'use client';

import Header from '../../../components/Header';
import { useState, useEffect } from 'react';
import { supabase, TABLES, Event, User } from '../../../lib/supabase';
import EventCard from '../../../components/EventCard';
import { FiUser, FiMail, FiMapPin, FiCalendar } from 'react-icons/fi';
import { use } from 'react';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function ProfilePage({ params }: { params: { uid: string } }) {
  const { uid } = params;
  return <ProfilePageContent uid={uid} />;
}

function ProfilePageContent({ uid }: { uid: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('id', uid)
          .single();

        if (userError) {
          console.error('Error fetching user:', userError);
          return;
        }

        setUser(userData);

        // Fetch user's events
        const { data: eventsData, error: eventsError } = await supabase
          .from(TABLES.EVENTS)
          .select('id, name, date, location, venue, category, presale_price, gate_price, image_url, featured, created_by, description, created_at')
          .eq('created_by', uid)
          .order('date', { ascending: true });

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          return;
        }

        setUserEvents(eventsData || []);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-500 mt-6 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">User not found</h3>
          <p className="text-gray-500">The user profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcomingEvents = userEvents.filter(event => event.date && new Date(event.date) >= now);
  const previousEvents = userEvents.filter(event => event.date && new Date(event.date) < now);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Profile Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{user.name || 'Unnamed User'}</h1>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-600 mb-6">
              {user.email && (
                <div className="flex items-center gap-2">
                  <FiMail size={16} />
                  <span>{user.email}</span>
                </div>
              )}
              {user.company && (
                <div className="flex items-center gap-2">
                  <FiUser size={16} />
                  <span>{user.company}</span>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-2">
                  <FiMapPin size={16} />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>

            {user.about && (
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {user.about}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Events by {user.name || 'this user'}
            </h2>
            <p className="text-gray-600 text-lg">
              {userEvents.length} total event{userEvents.length !== 1 ? 's' : ''} created
            </p>
          </div>

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Upcoming Events</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Previous Events */}
          {previousEvents.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Previous Events</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {previousEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* No Events */}
          {userEvents.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
              <p className="text-gray-500">
                {user.name || 'This user'} hasn't created any events yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-4 sm:px-8 bg-black border-t border-red-600">
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
