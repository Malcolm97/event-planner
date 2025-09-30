'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import { supabase, TABLES } from '@/lib/supabase';
import { FiUser, FiLogOut, FiMenu, FiX, FiSettings } from 'react-icons/fi';
import Image from 'next/image';
import { useNetworkStatus } from '@/context/NetworkStatusContext';

import React from 'react';
const Header = React.memo(function Header() {
  const { isOnline } = useNetworkStatus(); // Get the status
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null); // New state for user photo URL
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);


  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false); // New state for client-side check
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setHasMounted(true); // Set to true after component mounts on client
    setIsClient(true);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm sm:text-base">PNG</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Events
            </span>
          </Link>
          {/* Centered nav for desktop */}
          <nav className="hidden lg:flex flex-1 justify-center items-center space-x-4 xl:space-x-6">
            <Button onClick={() => router.push('/events')} variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm xl:text-base h-auto px-3 py-2">Events</Button>
            <Button onClick={() => router.push('/categories')} variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm xl:text-base h-auto px-3 py-2">Categories</Button>
            <Button onClick={() => router.push('/about')} variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm xl:text-base h-auto px-3 py-2">About</Button>
          </nav>
          {/* Right side actions for desktop */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">


            <Button onClick={() => router.push('/create-event')} variant="primary" size="sm" className="flex items-center text-sm xl:text-base">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden xl:inline">Create Event</span>
              <span className="xl:hidden">Create</span>
            </Button>

            {user ? (
              <div className="relative profile-dropdown">
                <Button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  variant="ghost"
                  className="flex items-center text-gray-700 hover:text-gray-900 font-medium transition-colors text-sm xl:text-base h-auto px-2 py-2 rounded-lg hover:bg-gray-100"
                  aria-expanded={isProfileDropdownOpen}
                  aria-haspopup="menu"
                >
                  {userPhotoUrl ? (
                    <Image src={userPhotoUrl} alt="User Photo" width={24} height={24} className="rounded-full inline mr-1 sm:mr-2" />
                  ) : (
                    <FiUser size={16} className="inline mr-1 sm:mr-2" />
                  )}
                  <span className="hidden xl:inline">{userName || 'Dashboard'}</span>
                  <span className="xl:hidden">{userName ? userName.split(' ')[0] : 'Profile'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-50">
                    <Button onClick={() => { router.push('/dashboard'); setIsProfileDropdownOpen(false); }} variant="ghost" className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <FiUser size={16} className="inline mr-2" />
                      Dashboard
                    </Button>
                    <Button onClick={() => { router.push('/settings'); setIsProfileDropdownOpen(false); }} variant="ghost" className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <FiSettings size={16} className="inline mr-2" />
                      Settings
                    </Button>
                    <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                    <Button onClick={() => { handleSignOut(); setIsProfileDropdownOpen(false); }} variant="ghost" className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <FiLogOut size={16} className="inline mr-2" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              hasMounted && isOnline && (
                <Button onClick={() => router.push('/signin')} variant="ghost" className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm xl:text-base h-auto px-2 py-2">
                  <FiUser size={14} className="inline mr-1 sm:mr-2" />Sign In
                </Button>
              )
            )}
          </div>
          {/* Hamburger for mobile */}
          <Button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            variant="ghost"
            className="p-2 sm:p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 lg:hidden h-auto"
            aria-label="Open navigation menu"
          >
            {isMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </Button>
        </div>
        {/* Dropdown Navigation for mobile only */}
        {isMenuOpen && (
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 py-4 sm:py-6 animate-slide-up lg:hidden">
            <nav className="flex flex-col space-y-2 sm:space-y-4">
              <Button onClick={() => { router.push('/events'); setIsMenuOpen(false); }} variant="ghost" className="text-left text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base w-full justify-start h-auto">Events</Button>
              <Button onClick={() => { router.push('/categories'); setIsMenuOpen(false); }} variant="ghost" className="text-left text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base w-full justify-start h-auto">Categories</Button>
              <Button onClick={() => { router.push('/about'); setIsMenuOpen(false); }} variant="ghost" className="text-left text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base w-full justify-start h-auto">About</Button>
              <Button onClick={() => { router.push('/settings'); setIsMenuOpen(false); }} variant="ghost" className="text-left text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base w-full justify-start h-auto">Settings</Button>
              {user ? (
                <>
                  <Button onClick={() => { router.push('/create-event'); setIsMenuOpen(false); }} variant="primary" className="w-full justify-center mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Event
                  </Button>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4 space-y-2 sm:space-y-4">
                    <Button onClick={() => { router.push('/dashboard'); setIsMenuOpen(false); }} variant="ghost" className="flex items-center text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base w-full justify-start h-auto">
                      {userPhotoUrl ? (
                        <Image src={userPhotoUrl} alt="User Photo" width={20} height={20} className="rounded-full inline mr-2" />
                      ) : (
                        <FiUser size={14} className="inline mr-2" />
                      )}
                      {userName || 'Dashboard'}
                    </Button>
                    <Button onClick={() => { handleSignOut(); setIsMenuOpen(false); }} variant="ghost" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base w-full justify-start h-auto">
                      <FiLogOut size={14} className="inline mr-2" />Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                hasMounted && isOnline && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                    <Button onClick={() => { router.push('/signin'); setIsMenuOpen(false); }} variant="ghost" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base w-full justify-start h-auto">
                      <FiUser size={14} className="inline mr-2" />Sign In
                    </Button>
                  </div>
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
