'use client';

import Header from '../../components/Header';
import { FiUsers, FiCalendar, FiMapPin, FiHeart, FiTrendingUp, FiAward, FiGlobe, FiSmile } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';

const features = [
  {
    icon: FiCalendar,
    title: 'Easy Event Creation',
    description: 'Create and manage events with our intuitive interface. Add photos, set dates, and reach your audience effortlessly.'
  },
  {
    icon: FiMapPin,
    title: 'Location-Based Discovery',
    description: 'Find events happening in your city or explore what\'s happening across Papua New Guinea.'
  },
  {
    icon: FiUsers,
    title: 'Community Building',
    description: 'Connect with like-minded people in your area and build lasting relationships through shared experiences.'
  },
  {
    icon: FiHeart,
    title: 'Passion-Driven',
    description: 'Whether it\'s music, art, food, or technology, find events that match your interests and passions.'
  }
];

const stats = [
  { icon: FiUsers, number: '10,000+', label: 'Active Users' },
  { icon: FiCalendar, number: '500+', label: 'Events Monthly' },
  { icon: FiMapPin, number: '20+', label: 'Cities Covered' },
  { icon: FiSmile, number: '50,000+', label: 'Happy Attendees' }
];

const team = [
  {
    name: 'Malcolm Sioni',
    role: 'Founder',
    bio: 'Building the platform that makes event discovery seamless.',
    image: '/window.svg' // Using a local image that's already cached by service worker
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      {/* Hero Section - Same as homepage */}
      <section className="w-full py-12 px-4 sm:px-8 bg-gradient-to-b from-yellow-300 to-red-600 border-b border-black">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">
            Bringing Communities Together
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-8 leading-relaxed">
            PNG Events is more than just an event platform – we're a community-driven initiative 
            dedicated to connecting people across Papua New Guinea through meaningful experiences, 
            cultural celebrations, and shared passions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events" className="px-8 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition shadow-lg">
              Explore Events
            </Link>
            <Link href="/create-event" className="px-8 py-3 bg-white text-gray-700 font-semibold rounded-lg hover:bg-yellow-100 transition shadow-lg border border-gray-200">
              Create Your Event
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-6xl mx-auto w-full py-16 px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              We believe that every community deserves access to vibrant, engaging events that bring people together. 
              Our mission is to democratize event discovery and creation, making it easy for anyone to find their tribe 
              and share their passions.
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              At PNG Events, we're committed to removing the barriers to event participation and creation. 
              We strive to empower individuals and organizations to share their events with the world, 
              fostering a more connected and engaged society.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-700">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-6xl mx-auto w-full py-16 px-4 sm:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Working to make PNG Events the best platform for community building.
          </p>
        </div>
        
        <div className="flex justify-center">
          {team.map((member, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition border border-gray-200 w-full max-w-sm">
              <div className="relative w-full h-64">
                <Image 
                  src={member.image} 
                  alt={member.name}
                  fill={true}
                  style={{objectFit: "cover"}}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-yellow-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Impact Section */}
      <section className="w-full py-16 px-4 sm:px-8 bg-gradient-to-r from-yellow-400 to-red-600">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Our Impact</h2>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
              Numbers that show how we're bringing communities together across Papua New Guinea.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="text-white" size={28} />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-gray-200">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 px-4 sm:px-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of Papua New Guineans who are already discovering amazing events and 
            building stronger communities through PNG Events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signin" className="px-8 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition shadow-lg">
              Sign Up
            </Link>
            <Link href="/events" className="px-8 py-3 bg-white text-gray-700 font-semibold rounded-lg hover:bg-yellow-100 transition shadow-lg border border-gray-200">
              Browse Events
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Same as homepage */}
      <footer className="w-full py-8 px-4 sm:px-8 bg-black border-t border-red-600 mt-auto">
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
