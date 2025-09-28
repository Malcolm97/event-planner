
"use client";
import AppFooter from '@/components/AppFooter';
import { FiUsers, FiCalendar, FiMapPin, FiWifi, FiWifiOff, FiSmartphone, FiDownload, FiStar, FiHeart, FiTrendingUp, FiEdit, FiSearch, FiBell, FiSettings, FiImage, FiGrid, FiUser, FiPlus, FiEye } from 'react-icons/fi';

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
      <section className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-yellow-300 to-red-600 text-white border-b border-black">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 sm:mb-8 tracking-tight leading-tight">
            PNG Events: Connecting Communities
          </h1>
          <p className="text-lg sm:text-xl text-gray-100 max-w-4xl mx-auto leading-relaxed mb-8 sm:mb-12">
            Discover, create, and celebrate events that bring Papua New Guinea together. Our platform empowers everyone to share their passions and build vibrant communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Link href="/events" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto min-w-[160px] px-8 py-3 text-lg">Explore Events</Button>
            </Link>
            <Button
              variant="primary"
              className="w-full sm:w-auto min-w-[160px] px-8 py-3 text-lg"
              disabled={!isOnline}
              aria-disabled={!isOnline}
              style={!isOnline ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              Create Your Event
            </Button>
          </div>
          {!isOnline && (
            <div className="text-center mt-6">
              <div className="inline-block bg-red-100 text-red-800 px-6 py-3 rounded-lg font-semibold text-base max-w-md">
                Offline Mode: Registration, login, and event creation are disabled.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-6xl mx-auto w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Our Mission</h2>
            <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
              <p>
                We believe that every community deserves access to vibrant, engaging events that bring people together.
                Our mission is to democratize event discovery and creation, making it easy for anyone to find their tribe
                and share their passions.
              </p>
              <p>
                At PNG Events, we're committed to removing the barriers to event participation and creation.
                We strive to empower individuals and organizations to share their events with the world,
                fostering a more connected and engaged society.
              </p>
            </div>
            {!isOnline && !hasCache && (
              <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-xl text-red-800 text-center font-semibold shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <FiWifiOff className="w-5 h-5 mr-2" />
                  Offline Mode
                </div>
                No cached stats available. Connect to the internet to see platform statistics.
              </div>
            )}
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="grid grid-cols-3 gap-6 sm:gap-8 w-full max-w-md">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-sm sm:text-base text-gray-600 font-medium leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">Powerful Features for Event Management</h2>
            <p className="text-lg sm:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Everything you need to discover, create, and manage events with ease
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Event Creation & Management */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200">
              <div className="flex items-center mb-6">
                <div className="bg-blue-500 rounded-full p-3 mr-4 flex-shrink-0">
                  <FiPlus className="text-white w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Create & Edit Events</h3>
                  <p className="text-sm sm:text-base text-gray-600">Full event management</p>
                </div>
              </div>
              <p className="text-base sm:text-lg text-gray-700 mb-4 leading-relaxed">
                Create detailed events with rich descriptions, images, dates, and locations. Edit and update your events anytime with our intuitive dashboard.
              </p>
              <div className="flex items-center text-blue-600 font-semibold">
                <FiEdit className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">Easy event management tools</span>
              </div>
            </div>

            {/* Event Discovery */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-green-200">
              <div className="flex items-center mb-6">
                <div className="bg-green-500 rounded-full p-3 mr-4 flex-shrink-0">
                  <FiSearch className="text-white w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Smart Discovery</h3>
                  <p className="text-sm sm:text-base text-gray-600">Find events easily</p>
                </div>
              </div>
              <p className="text-base sm:text-lg text-gray-700 mb-4 leading-relaxed">
                Browse events by category, location, or date. Our intelligent search helps you find exactly what you're looking for in seconds.
              </p>
              <div className="flex items-center text-green-600 font-semibold">
                <FiEye className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">Advanced filtering options</span>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-200">
              <div className="flex items-center mb-6">
                <div className="bg-purple-500 rounded-full p-3 mr-4 flex-shrink-0">
                  <FiGrid className="text-white w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Organized Categories</h3>
                  <p className="text-sm sm:text-base text-gray-600">Structured event types</p>
                </div>
              </div>
              <p className="text-base sm:text-lg text-gray-700 mb-4 leading-relaxed">
                Events are organized into clear categories like sports, music, business, and community events, making discovery effortless.
              </p>
              <div className="flex items-center text-purple-600 font-semibold">
                <FiStar className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">Intuitive categorization</span>
              </div>
            </div>

            {/* User Profiles */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-yellow-200">
              <div className="flex items-center mb-6">
                <div className="bg-yellow-500 rounded-full p-3 mr-4 flex-shrink-0">
                  <FiUser className="text-white w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">User Profiles</h3>
                  <p className="text-sm sm:text-base text-gray-600">Personal event spaces</p>
                </div>
              </div>
              <p className="text-base sm:text-lg text-gray-700 mb-4 leading-relaxed">
                Create your personal profile to showcase your events and connect with other event organizers and attendees in the community.
              </p>
              <div className="flex items-center text-yellow-600 font-semibold">
                <FiHeart className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">Build your event network</span>
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-pink-200">
              <div className="flex items-center mb-6">
                <div className="bg-pink-500 rounded-full p-3 mr-4 flex-shrink-0">
                  <FiImage className="text-white w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Rich Media Support</h3>
                  <p className="text-sm sm:text-base text-gray-600">Visual event showcase</p>
                </div>
              </div>
              <p className="text-base sm:text-lg text-gray-700 mb-4 leading-relaxed">
                Upload high-quality images to make your events stand out. Our optimized image system ensures fast loading and great visual appeal.
              </p>
              <div className="flex items-center text-pink-600 font-semibold">
                <FiStar className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">Optimized image handling</span>
              </div>
            </div>

            {/* Settings & Customization */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-200">
              <div className="flex items-center mb-6">
                <div className="bg-indigo-500 rounded-full p-3 mr-4 flex-shrink-0">
                  <FiSettings className="text-white w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Personalized Settings</h3>
                  <p className="text-sm sm:text-base text-gray-600">Tailored experience</p>
                </div>
              </div>
              <p className="text-base sm:text-lg text-gray-700 mb-4 leading-relaxed">
                Customize your experience with personal settings, notification preferences, and account management tools designed for your needs.
              </p>
              <div className="flex items-center text-indigo-600 font-semibold">
                <FiBell className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">Smart notification system</span>
              </div>
            </div>
          </div>

          {/* Additional Features Highlight */}
          <div className="mt-12 sm:mt-16 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 sm:p-8 border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Built for Papua New Guinea</h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6">
                  Our platform is specifically designed to serve PNG communities with features that understand local needs,
                  connectivity challenges, and cultural preferences. We support multiple languages and local event types.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">Multi-language Support</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">Local Event Types</span>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">Cultural Integration</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <FiTrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <FiUsers className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">1000+</div>
                  <div className="text-sm text-gray-600">Communities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offline & Mobile Experience Section */}
      <section className="w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">Never Miss an Event</h2>
            <p className="text-lg sm:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Experience the freedom of discovering events anywhere, anytime - even without internet connection
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-16">
            {/* Offline Mode Feature */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 transform hover:scale-105 transition-all duration-300 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 rounded-full p-3 mr-4 flex-shrink-0">
                  {isOnline ? (
                    <FiWifi className="text-blue-600 w-6 sm:w-8 h-6 sm:h-8" />
                  ) : (
                    <FiWifiOff className="text-orange-600 w-6 sm:w-8 h-6 sm:h-8" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Smart Offline Mode</h3>
                  <p className="text-sm sm:text-base text-gray-600">Works without internet</p>
                </div>
              </div>
              <p className="text-base sm:text-lg text-gray-700 mb-6 leading-relaxed">
                Browse your saved events, view event details, and plan your schedule even when you're offline.
                Our intelligent caching system ensures you never lose access to important event information.
              </p>
              <div className="flex items-center text-green-600 font-semibold bg-green-50 p-3 rounded-lg">
                <FiStar className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">Perfect for areas with limited connectivity</span>
              </div>
            </div>

            {/* Save to Phone Feature */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 transform hover:scale-105 transition-all duration-300 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="bg-green-100 rounded-full p-3 mr-4 flex-shrink-0">
                  <FiSmartphone className="text-green-600 w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Save to Your Phone</h3>
                  <p className="text-sm sm:text-base text-gray-600">Progressive Web App</p>
                </div>
              </div>
              <p className="text-base sm:text-lg text-gray-700 mb-6 leading-relaxed">
                Install PNG Events on your phone's home screen for lightning-fast access. Get push notifications,
                enjoy app-like performance, and have your events always at your fingertips.
              </p>
              <div className="flex items-center text-blue-600 font-semibold bg-blue-50 p-3 rounded-lg">
                <FiDownload className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm sm:text-base">Add to home screen in one tap</span>
              </div>
            </div>
          </div>

          {/* Marketing Benefits */}
          <div className="bg-gradient-to-r from-yellow-400 to-red-500 rounded-2xl p-6 sm:p-8 text-white text-center shadow-lg">
            <h3 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Why Choose PNG Events?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="flex flex-col items-center p-4 rounded-xl bg-white bg-opacity-10">
                <FiHeart className="w-10 sm:w-12 h-10 sm:h-12 mb-3 sm:mb-4 text-white" />
                <h4 className="text-lg sm:text-xl font-semibold mb-2">Community First</h4>
                <p className="text-sm sm:text-base text-gray-100 leading-relaxed">Built by Papua New Guineans, for Papua New Guineans</p>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-white bg-opacity-10">
                <FiTrendingUp className="w-10 sm:w-12 h-10 sm:h-12 mb-3 sm:mb-4 text-white" />
                <h4 className="text-lg sm:text-xl font-semibold mb-2">Always Improving</h4>
                <p className="text-sm sm:text-base text-gray-100 leading-relaxed">Regular updates based on your feedback</p>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-white bg-opacity-10">
                <FiStar className="w-10 sm:w-12 h-10 sm:h-12 mb-3 sm:mb-4 text-white" />
                <h4 className="text-lg sm:text-xl font-semibold mb-2">Award Winning</h4>
                <p className="text-sm sm:text-base text-gray-100 leading-relaxed">Trusted by thousands of event organizers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-6xl mx-auto w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">Meet Our Team</h2>
          <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto font-light leading-relaxed">
            Passionate people dedicated to building a connected PNG through memorable events and experiences.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 lg:gap-12">
          {team.map((member, index) => (
            <div key={index} className="bg-white rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300 border border-gray-200 w-full max-w-xs flex flex-col">
              <div className="relative w-full h-48 sm:h-64">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill={true}
                  style={{objectFit: "cover"}}
                  className="object-center sm:object-top"
                />
              </div>
              <div className="p-6 sm:p-8 text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-yellow-600 font-semibold mb-3 sm:mb-4 text-base sm:text-lg">{member.role}</p>
                <p className="text-gray-600 leading-relaxed font-light text-sm sm:text-base">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Impact Section */}
      <section className="w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-yellow-400 to-red-500 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">Our Impact</h2>
            <p className="text-lg sm:text-xl text-gray-100 max-w-3xl mx-auto opacity-90 leading-relaxed">
              Numbers that showcase our commitment to fostering vibrant communities and unforgettable events.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center p-4 sm:p-6 bg-white bg-opacity-10 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Icon className="text-white w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-gray-100 text-base sm:text-lg font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
          {!isOnline && !hasCache && (
            <div className="mt-8 p-6 bg-red-100 border border-red-300 rounded-xl text-red-800 text-center font-semibold shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <FiWifiOff className="w-5 h-5 mr-2" />
                Offline Mode
              </div>
              No cached stats available. Connect to the internet to see platform impact.
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-100 border-t border-gray-200">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">Ready to Get Started?</h2>
          <p className="text-lg sm:text-xl text-gray-700 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of Papua New Guineans who are already discovering amazing events and
            building stronger communities through PNG Events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto min-w-[180px] px-8 py-4 text-lg font-semibold"
              disabled={!isOnline}
              aria-disabled={!isOnline}
              style={!isOnline ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              Sign Up Now
            </Button>
            <Link href="/events" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[180px] px-8 py-4 text-lg font-semibold">
                Browse Events
              </Button>
            </Link>
          </div>
          {!isOnline && (
            <div className="text-center mt-6">
              <div className="inline-block bg-red-100 text-red-800 px-6 py-3 rounded-xl font-semibold text-base max-w-lg shadow-sm">
                <div className="flex items-center justify-center">
                  <FiWifiOff className="w-4 h-4 mr-2" />
                  Offline Mode: Registration, login, and event creation are disabled.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
