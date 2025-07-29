'use client';

import Header from '../../components/Header';
import { FiUsers, FiCalendar, FiMapPin, FiHeart, FiTrendingUp, FiAward, FiGlobe, FiSmile } from 'react-icons/fi';
import Link from 'next/link';

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
    name: 'Sarah Johnson',
    role: 'Founder & CEO',
    bio: 'Passionate about connecting communities through meaningful events.',
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    name: 'Michael Chen',
    role: 'Head of Technology',
    bio: 'Building the platform that makes event discovery seamless.',
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    name: 'Emma Wilson',
    role: 'Community Manager',
    bio: 'Fostering connections and ensuring every event creates lasting memories.',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6fb]">
      <Header />
      
      {/* Hero Section */}
      <section className="w-full py-20 px-4 sm:px-8 bg-gradient-to-b from-[#e0c3fc] to-[#8ec5fc]">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Bringing Communities Together
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            PNG Events is more than just an event platform – we're a community-driven initiative 
            dedicated to connecting people across Papua New Guinea through meaningful experiences, 
            cultural celebrations, and shared passions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events" className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-lg">
              Explore Events
            </Link>
            <Link href="/create-event" className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-50 transition shadow-lg border border-indigo-200">
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
              From intimate workshops in Port Moresby to large festivals in Lae, we're building a platform that 
              celebrates the rich cultural diversity of Papua New Guinea while fostering new connections and experiences.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <FiHeart className="text-indigo-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Built with Love</h3>
                <p className="text-gray-600">Every feature designed with our community in mind</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800" 
              alt="Community gathering"
              className="rounded-2xl shadow-xl w-full h-96 object-cover"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <FiUsers className="text-indigo-600" size={24} />
                <div>
                  <div className="font-bold text-gray-900">Community First</div>
                  <div className="text-sm text-gray-600">People over profit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 px-4 sm:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose PNG Events?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We've built features that make discovering and creating events as easy as possible, 
              while keeping the focus on building real connections.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex gap-4 p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="text-indigo-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-16 px-4 sm:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Our Impact</h2>
            <p className="text-lg text-indigo-100 max-w-2xl mx-auto">
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
                  <div className="text-indigo-100">{stat.label}</div>
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
            The passionate individuals working to make PNG Events the best platform for community building.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
              <img 
                src={member.image} 
                alt={member.name}
                className="w-full h-64 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-indigo-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 px-4 sm:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of Papua New Guineans who are already discovering amazing events and 
            building stronger communities through PNG Events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signin" className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-lg">
              Join Our Community
            </Link>
            <Link href="/events" className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-50 transition shadow-lg border border-indigo-200">
              Browse Events
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-4 sm:px-8 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
          <div className="flex gap-6 mb-2 md:mb-0">
            <a href="/events" className="hover:text-indigo-600">Events</a>
            <a href="/categories" className="hover:text-indigo-600">Categories</a>
            <a href="/about" className="hover:text-indigo-600">About</a>
          </div>
          <div className="text-center">© 2025 PNG Events. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-indigo-600">Terms</a>
            <a href="#" className="hover:text-indigo-600">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}