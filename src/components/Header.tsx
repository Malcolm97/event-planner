'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, TABLES } from '@/lib/supabase';
import { FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import Image from 'next/image';
import { useNetworkStatus } from '@/context/NetworkStatusContext';

import React from 'react';
const Header = React.memo(function Header() {
  const { isOnline } = useNetworkStatus(); // Get the status
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null); // New state for user photo URL
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false); // New state for client-side check
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setHasMounted(true); // Set to true after component mounts on client
    setIsClient(true);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Fetch user name and photo from profile
        const { data } = await supabase
          .from(TABLES.USERS)
          .select('name, photo_url')
          .eq('id', user.id)
          .single();
        
        if (data?.name) {
          setUserName(data.name);
        }
        if (data?.photo_url) {
          setUserPhotoUrl(data.photo_url);
        }
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Fetch user name and photo from profile
        const { data } = await supabase
          .from(TABLES.USERS)
          .select('name, photo_url')
          .eq('id', session.user.id)
          .single();
        
        if (data?.name) {
          setUserName(data.name);
        }
        if (data?.photo_url) {
          setUserPhotoUrl(data.photo_url);
        } else {
          setUserPhotoUrl(null);
        }
      } else {
        setUser(null);
        setUserName('');
        setUserPhotoUrl(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="glass-effect shadow-lg border-b border-gray-200/50 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-base">PNG</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">
              Events
            </span>
          </Link>
          {/* Centered nav for desktop */}
          <nav className="hidden md:flex flex-1 justify-center items-center space-x-8">
            <button onClick={() => router.push('/events')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Events</button>
            <button onClick={() => router.push('/categories')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Categories</button>
            <button onClick={() => router.push('/about')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">About</button>
          </nav>
          {/* Right side actions for desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <button onClick={() => router.push('/create-event')} className="btn-primary flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </button>
            <button onClick={() => router.push('/settings')} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Settings</button>
            {user ? (
              <>
                <button onClick={() => router.push('/dashboard')} className="flex items-center text-gray-700 hover:text-gray-900 font-medium transition-colors">
                  {userPhotoUrl ? (
                    <Image src={userPhotoUrl} alt="User Photo" width={24} height={24} className="rounded-full inline mr-2" />
                  ) : (
                    <FiUser size={16} className="inline mr-2" />
                  )}
                  {userName || 'Dashboard'}
                </button>
                <button onClick={handleSignOut} className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  <FiLogOut size={16} className="inline mr-2" />Sign Out
                </button>
              </>
            ) : (
              hasMounted && isOnline && (
                <button onClick={() => router.push('/signin')} className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  <FiUser size={16} className="inline mr-2" />Sign In
                </button>
              )
            )}
          </div>
          {/* Hamburger for mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 md:hidden"
            aria-label="Open navigation menu"
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
        {/* Dropdown Navigation for mobile only */}
        {isMenuOpen && (
          <div className="border-t border-gray-200/50 py-6 animate-slide-up md:hidden">
            <nav className="flex flex-col space-y-4">
              <button onClick={() => { router.push('/events'); setIsMenuOpen(false); }} className="text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 px-4 py-3 rounded-lg font-medium">Events</button>
              <button onClick={() => { router.push('/categories'); setIsMenuOpen(false); }} className="text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 px-4 py-3 rounded-lg font-medium">Categories</button>
              <button onClick={() => { router.push('/about'); setIsMenuOpen(false); }} className="text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 px-4 py-3 rounded-lg font-medium">About</button>
              <button onClick={() => { router.push('/settings'); setIsMenuOpen(false); }} className="text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 px-4 py-3 rounded-lg font-medium">Settings</button>
              {user ? (
                <>
                  <button onClick={() => { router.push('/create-event'); setIsMenuOpen(false); }} className="btn-primary w-full justify-center"> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Create Event</button>
                  <button onClick={() => { router.push('/dashboard'); setIsMenuOpen(false); }} className="text-left text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 px-4 py-3 rounded-lg border-t border-gray-200 pt-6 mt-4 font-medium">{userPhotoUrl ? (<Image src={userPhotoUrl} alt="User Photo" width={24} height={24} className="rounded-full inline mr-2" />) : (<FiUser size={16} className="inline mr-2" />)}{userName || 'Dashboard'}</button>
                  <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }} className="text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 px-4 py-3 rounded-lg font-medium"><FiLogOut size={16} className="inline mr-2" />Sign Out</button>
                </>
              ) : (
                hasMounted && isOnline && (
                  <button onClick={() => { router.push('/signin'); setIsMenuOpen(false); }} className="text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 px-4 py-3 rounded-lg border-t border-gray-200 pt-6 mt-4 font-medium"><FiUser size={16} className="inline mr-2" />Sign In</button>
                )
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
});
export default Header;
