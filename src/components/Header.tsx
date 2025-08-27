'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, TABLES } from '@/lib/supabase';
import { FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import Image from 'next/image';
import { useNetworkStatus } from '@/context/NetworkStatusContext';

export default function Header() {
  const { isOnline, lastSaved, setLastSaved } = useNetworkStatus(); // Get the status and lastSaved
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

  // Function to format the date and time for display
  const formatLastSaved = (timestamp: string | null) => {
    if (!timestamp) return '';
    if (!isClient) return '';
    try {
      const date = new Date(timestamp);
      return `Last saved: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return '';
    }
  };

  return (
<header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PNG</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Events
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => router.push('/events')} className="text-gray-600 hover:text-gray-900 transition-colors">
              Events
            </button>
            <button onClick={() => router.push('/categories')} className="text-gray-600 hover:text-gray-900 transition-colors">
              Categories
            </button>
            <button onClick={() => router.push('/about')} className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </button>
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/create-event')}
                  className="btn-primary gap-2 shadow-sm hover:shadow"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Event
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {userPhotoUrl ? (
                    <Image src={userPhotoUrl} alt="User Photo" width={24} height={24} className="rounded-full" />
                  ) : (
                    <FiUser size={16} />
                  )}
                  {userName || 'Dashboard'}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <FiLogOut size={16} />
                  Sign Out
                </button>
              </div>
              ) : (
                // Conditionally render Sign In and Create Event buttons only after client-side mount
                hasMounted && isOnline && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => router.push('/signin')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Event
                    </button>
                    <Link
                      href="/signin"
                      className="btn-primary gap-2 shadow-sm hover:shadow"
                    >
                      <FiUser size={16} />
                      Sign In
                    </Link>
                  </div>
                )
              )}
            {/* Display last saved timestamp */}
            {lastSaved && (
              <span className="text-sm text-gray-500">
                {formatLastSaved(lastSaved)}
              </span>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => { router.push('/events'); setIsMenuOpen(false); }}
                className="text-left text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
              >
                Events
              </button>
              <button
                onClick={() => { router.push('/categories'); setIsMenuOpen(false); }}
                className="text-left text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
              >
                Categories
              </button>
              <button
                onClick={() => { router.push('/about'); setIsMenuOpen(false); }}
                className="text-left text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
              >
                About
              </button>
              
              {user ? (
                <>
                  <button
                    onClick={() => {
                      if (!user) {
                        router.push('/signin');
                      } else {
                        router.push('/create-event');
                      }
                      setIsMenuOpen(false); // Close mobile menu after click
                    }}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 active:scale-95 mx-auto w-full sm:w-1/2 block text-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Event
                  </button>
                  <button
                    onClick={() => { router.push('/dashboard'); setIsMenuOpen(false); }}
                    className="text-left text-gray-700 hover:text-gray-900 transition-colors px-4 py-2 border-t border-gray-200 pt-4"
                  >
                    {userPhotoUrl ? (
                      <Image src={userPhotoUrl} alt="User Photo" width={24} height={24} className="rounded-full inline mr-2" />
                    ) : (
                      <FiUser size={16} className="inline mr-2" />
                    )}
                    {userName || 'Dashboard'}
                  </button>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-left text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
                  >
                    <FiLogOut size={16} className="inline mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                // Conditionally render Sign In link for mobile only after client-side mount
                hasMounted && isOnline && (
                  <button
                    onClick={() => { router.push('/signin'); setIsMenuOpen(false); }}
                    className="text-left text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 border-t border-gray-200 pt-4"
                  >
                    <FiUser size={16} className="inline mr-2" />
                    Sign In
                  </button>
                )
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
