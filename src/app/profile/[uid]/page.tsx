"use client";
import AppFooter from '@/components/AppFooter';
import { useState, useEffect } from 'react';
import { supabase, TABLES, Event, User } from '@/lib/supabase';
import EventCard from '@/components/EventCard';
import { FiUser, FiMail, FiMapPin, FiCalendar } from 'react-icons/fi';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: any }) {
  const resolvedParams = await params;
  const uid = resolvedParams?.uid as string;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-500 mt-6 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">User not found</h3>
          <p className="text-gray-500">The user profile you're looking for doesn't exist.</p>
          <button className="mt-6 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1">
        <section className="max-w-3xl mx-auto py-12 px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{user.name || 'User Profile'}</h1>
            <p className="text-gray-600">{user.about}</p>
          </div>
          <div className="space-y-4">
            {user.email && (
              <div className="flex items-center gap-2 text-gray-700"><FiMail size={16} /> {user.email}</div>
            )}
            {user.company && (
              <div className="flex items-center gap-2 text-gray-700"><FiUser size={16} /> {user.company}</div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2 text-gray-700"><FiMapPin size={16} /> {user.phone}</div>
            )}
          </div>
        </section>
        <section className="max-w-5xl mx-auto py-8 px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Events by {user.name || 'this user'}</h2>
          {userEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-12">No events yet.</div>
          )}
        </section>
      </main>
    </div>
  );
}
