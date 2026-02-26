'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiHome, FiSearch, FiPlus, FiUser, FiSettings, FiTag, FiInfo, FiMenu, FiUsers, FiLogIn, FiLogOut } from 'react-icons/fi';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function BottomNav() {
  const { isOnline } = useNetworkStatus();
  const { user } = useAuth();
  const router = useRouter();
  const currentPath = usePathname();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    setIsHamburgerOpen(false);
  };
  
  const handleSignIn = () => {
    router.push('/signin');
    setIsHamburgerOpen(false);
  };

  const navItems = [
    {
      icon: FiHome,
      label: 'Home',
      path: '/',
      active: currentPath === '/' || currentPath === '',
    },
    {
      icon: FiSearch,
      label: 'Events',
      path: '/events',
      active: currentPath === '/events' || currentPath?.startsWith('/events'),
    },
    {
      icon: FiTag,
      label: 'Categories',
      path: '/categories',
      active: currentPath === '/categories' || currentPath?.startsWith('/categories'),
    },
    {
      icon: FiPlus,
      label: 'Create',
      path: '/create-event',
      active: currentPath === '/create-event',
      primary: true,
    },
    {
      icon: FiUsers,
      label: 'Creators',
      path: '/creators',
      active: currentPath === '/creators',
    },
    {
      icon: FiUser,
      label: 'Profile',
      path: '/dashboard',
      active: currentPath?.startsWith('/dashboard') || currentPath?.startsWith('/profile'),
    },
    {
      icon: FiMenu,
      label: 'Menu',
      path: 'hamburger',
      active: false,
      hamburger: true,
    },
  ];

  const navigateWithOfflineCheck = (path: string, description: string) => {
    // Always allow navigation to pages with offline support
    const alwaysAllowedPaths = ['/', '/events', '/categories', '/creators', '/dashboard', '/settings', '/about'];

    if (isOnline || alwaysAllowedPaths.includes(path)) {
      router.push(path);
      return;
    }

    // For dynamic pages when offline, show a message
    toast.error(`"${description}" is not available offline. Please connect to the internet and try again.`, {
      duration: 4000,
    });
  };

  return (
    <nav className="bottom-nav lg:hidden dark:bg-gray-800/95 dark:border-gray-700/50 transition-colors duration-300">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          if (item.primary) {
            // Special styling for the create button
            return (
              <button
                key={item.path}
                onClick={() => navigateWithOfflineCheck(item.path, item.label)}
                className="relative -mt-4 flex flex-col items-center justify-center touch-target focus-ring"
                aria-label={`Go to ${item.label}`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-red-500 flex items-center justify-center shadow-lg transform transition-transform active:scale-95">
                  <Icon size={18} className="text-white" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => {
                if (item.hamburger) {
                  setIsHamburgerOpen(!isHamburgerOpen);
                } else {
                  navigateWithOfflineCheck(item.path, item.label);
                }
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-200 touch-target focus-ring ${
                isActive
                  ? 'text-yellow-600 bg-yellow-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              aria-label={item.hamburger ? 'Open menu' : `Go to ${item.label}`}
            >
              <Icon
                size={16}
                className={`mb-0.5 transition-colors ${
                  isActive ? 'text-yellow-600' : 'text-gray-600'
                }`}
              />
              <span className={`text-[10px] font-medium hidden sm:inline ${
                isActive ? 'text-yellow-700' : 'text-gray-600'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hamburger Menu Overlay */}
      {isHamburgerOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm" onClick={() => setIsHamburgerOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto transition-colors duration-300">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h3>
                <button
                  onClick={() => setIsHamburgerOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              {/* Menu Items */}
              <div className="space-y-4">
                {/* Sign In / Sign Out Button */}
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiLogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                  >
                    <FiLogIn size={20} />
                    <span className="font-medium">Sign In</span>
                  </button>
                )}
                
                <button
                  onClick={() => { router.push('/about'); setIsHamburgerOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <FiInfo size={20} />
                  <span className="font-medium">About</span>
                </button>
                <button
                  onClick={() => { router.push('/settings'); setIsHamburgerOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <FiSettings size={20} />
                  <span className="font-medium">Settings</span>
                </button>
                <button
                  onClick={() => { router.push('/terms'); setIsHamburgerOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-xl">📄</span>
                  <span className="font-medium">Terms</span>
                </button>
                <button
                  onClick={() => { router.push('/privacy'); setIsHamburgerOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-xl">🔒</span>
                  <span className="font-medium">Privacy</span>
                </button>
                <button
                  onClick={() => { router.push('/download'); setIsHamburgerOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-xl">⬇️</span>
                  <span className="font-medium">Download</span>
                </button>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500 space-y-1">
                <p>Version 0.1.0</p>
                <p className="mt-2">© 2026 PNG Events. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
