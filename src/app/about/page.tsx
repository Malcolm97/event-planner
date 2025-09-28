
"use client";
import AppFooter from '@/components/AppFooter';
import { FiUsers, FiCalendar, FiMapPin } from 'react-icons/fi';

// ...existing code...
import Link from 'next/link';
import Button from '@/components/Button';
import Image from 'next/image';
import { supabase, TABLES } from '@/lib/supabase';
import { EventItem } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useOfflineFirstData } from '@/hooks/useOfflineFirstData';

// Removed invalid revalidate export for client component



const team = [
  {
    name: 'Malcolm Sioni',
    role: 'Founder',
    bio: 'Building the platform that makes event discovery seamless.',
    image: '/window.svg' // Using a local image that's already cached by service worker
  }
];

function getStatsFromEvents(events: EventItem[]) {
  // Calculate stats from cached events
  const totalEvents = events.length;
  const uniqueCities = new Set<string>();
  events.forEach((event) => {
    if (event.location) {
      const firstPart = event.location.split(',')[0]?.trim();
      if (firstPart) uniqueCities.add(firstPart);
    }
  });
  return {
    totalEvents,
    totalUsers: null, // Not available offline
    citiesCovered: uniqueCities.size,
  };
}

export default function AboutPage() {
  const { isOnline } = useNetworkStatus();
  const { data: cachedEvents, isLoading: isLoadingEvents } = useOfflineFirstData<EventItem>('events');
  const [stats, setStats] = useState([
    { icon: FiUsers, number: '...', label: 'Active Users' },
    { icon: FiCalendar, number: '...', label: 'Events Created' },
    { icon: FiMapPin, number: '...', label: 'Cities Covered' },
  ]);
  const [hasCache, setHasCache] = useState(false);

  useEffect(() => {
    if (cachedEvents && cachedEvents.length > 0) {
      setHasCache(true);
      const { totalEvents, citiesCovered } = getStatsFromEvents(cachedEvents);
      setStats([
        { icon: FiUsers, number: isOnline ? '...' : 'N/A', label: 'Active Users' },
        { icon: FiCalendar, number: totalEvents.toLocaleString() + '+', label: 'Events Created' },
        { icon: FiMapPin, number: citiesCovered.toLocaleString() + '+', label: 'Cities Covered' },
      ]);
    } else {
      setHasCache(false);
      setStats([
        { icon: FiUsers, number: isOnline ? '...' : 'N/A', label: 'Active Users' },
        { icon: FiCalendar, number: isOnline ? '...' : 'N/A', label: 'Events Created' },
        { icon: FiMapPin, number: isOnline ? '...' : 'N/A', label: 'Cities Covered' },
      ]);
    }
  }, [cachedEvents, isOnline]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero Section */}
      <section className="w-full py-24 px-4 sm:px-8 bg-gradient-to-br from-yellow-400 to-red-500 text-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-extrabold mb-8 tracking-tight leading-tight drop-shadow-lg">
            PNG Events: Connecting Communities
          </h1>
          <p className="text-2xl max-w-3xl mx-auto mb-12 leading-relaxed opacity-95 font-light">
            Discover, create, and celebrate events that bring Papua New Guinea together. Our platform empowers everyone to share their passions and build vibrant communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/events">
              <Button variant="secondary" className="w-full sm:w-auto">Explore Events</Button>
            </Link>
            <Button variant="primary" className="w-full sm:w-auto" disabled={!isOnline} aria-disabled={!isOnline} style={!isOnline ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>Create Your Event</Button>
          </div>
          {!isOnline && (
            <div className="text-center mt-4">
              <div className="inline-block bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold text-base">Offline Mode: Registration, login, and event creation are disabled.</div>
            </div>
          )}
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-6xl mx-auto w-full py-24 px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-8">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              We believe that every community deserves access to vibrant, engaging events that bring people together. 
              Our mission is to democratize event discovery and creation, making it easy for anyone to find their tribe 
              and share their passions.
            </p>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              At PNG Events, we're committed to removing the barriers to event participation and creation. 
              We strive to empower individuals and organizations to share their events with the world, 
              fostering a more connected and engaged society.
            </p>
            {!isOnline && !hasCache && (
              <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center font-semibold">
                Offline: No cached stats available. Connect to the internet to see platform stats.
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-6 md:gap-10">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg shadow-sm">
                  <Icon className="text-red-500 w-10 h-10 mb-3" />
                  <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-700 text-lg">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-6xl mx-auto w-full py-24 px-4 sm:px-8 bg-gray-50">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">Meet Our Team</h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto font-light">
            Passionate people dedicated to building a connected PNG through memorable events and experiences.
          </p>
        </div>
  <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
          {team.map((member, index) => (
            <div key={index} className="bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 border border-gray-200 w-full max-w-xs flex flex-col items-center">
              <div className="relative w-full h-64">
                <Image 
                  src={member.image} 
                  alt={member.name}
                  fill={true}
                  style={{objectFit: "cover"}}
                  className="object-top"
                />
              </div>
              <div className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-yellow-600 font-semibold mb-4 text-lg">{member.role}</p>
                <p className="text-gray-600 leading-relaxed font-light">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Impact Section */}
      <section className="w-full py-24 px-4 sm:px-8 bg-gradient-to-br from-yellow-400 to-red-500 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Impact</h2>
            <p className="text-lg text-gray-100 max-w-2xl mx-auto opacity-90">
              Numbers that showcase our commitment to fostering vibrant communities and unforgettable events.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-10">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center p-6 bg-white bg-opacity-10 rounded-lg shadow-md">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="text-white" size={32} />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-gray-100 text-lg">{stat.label}</div>
                </div>
              );
            })}
          </div>
          {!isOnline && !hasCache && (
            <div className="mt-8 p-6 bg-red-100 border border-red-300 rounded-lg text-red-800 text-center font-semibold">
              Offline: No cached stats available. Connect to the internet to see platform impact.
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-24 px-4 sm:px-8 bg-gray-100 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
          <p className="text-lg text-gray-700 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of Papua New Guineans who are already discovering amazing events and 
            building stronger communities through PNG Events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="btn-primary text-lg px-10 py-4" disabled={!isOnline} aria-disabled={!isOnline} style={!isOnline ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>Sign Up Now</Button>
            <Link href="/events" className="btn-secondary text-lg px-10 py-4">
              Browse Events
            </Link>
          </div>
          {!isOnline && (
            <div className="text-center mt-4">
              <div className="inline-block bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold text-base">Offline Mode: Registration, login, and event creation are disabled.</div>
            </div>
          )}
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
