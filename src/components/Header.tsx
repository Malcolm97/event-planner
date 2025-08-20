'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, TABLES } from '../lib/supabase';
import { FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import Image from 'next/image'; // Import Image component
import { useNetworkStatus } from '../context/NetworkStatusContext'; // Import the hook

export default function Header() {
  const { isOnline } = useNetworkStatus(); // Get the status
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null); // New state for user photo URL
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

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
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PNG</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              {isOnline ? 'Online Events' : 'Offline Events'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/events" className="text-gray-600 hover:text-gray-900 transition-colors">
              Events
            </Link>
            <Link href="/categories" className="text-gray-600 hover:text-gray-900 transition-colors">
              Categories
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </Link>
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
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
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
              >
                <FiUser size={16} />
                Sign In
              </Link>
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
              <Link
                href="/events"
                className="text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Events
              </Link>
              <Link
                href="/categories"
                className="text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link
                href="/about"
                className="text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-gray-900 transition-colors px-4 py-2 border-t border-gray-200 pt-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {userPhotoUrl ? (
                      <Image src={userPhotoUrl} alt="User Photo" width={24} height={24} className="rounded-full inline mr-2" />
                    ) : (
                      <FiUser size={16} className="inline mr-2" />
                    )}
                    {userName || 'Dashboard'}
                  </Link>
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
                <Link
                  href="/signin"
                  className="text-left text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 border-t border-gray-200 pt-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiUser size={16} className="inline mr-2" />
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
