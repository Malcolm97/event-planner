'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiHome, FiSearch, FiPlus, FiUser, FiSettings, FiTag, FiInfo } from 'react-icons/fi';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { toast } from 'react-hot-toast';

export default function BottomNav() {
  const { isOnline } = useNetworkStatus();
  const router = useRouter();
  const currentPath = usePathname();

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
      icon: FiSettings,
      label: 'Settings',
      path: '/settings',
      active: currentPath === '/settings' || currentPath?.startsWith('/settings'),
    },
    {
      icon: FiInfo,
      label: 'About',
      path: '/about',
      active: currentPath === '/about',
    },
    {
      icon: FiUser,
      label: 'Profile',
      path: '/dashboard',
      active: currentPath?.startsWith('/dashboard') || currentPath?.startsWith('/profile'),
    },
  ];

  const navigateWithOfflineCheck = (path: string, description: string) => {
    // Always allow navigation to home, settings, and about (static-ish pages)
    const alwaysAllowedPaths = ['/', '/settings', '/about'];

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
    <nav className="bottom-nav lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          if (item.primary) {
            // Special styling for the create button
            return (
              <button
                key={item.path}
                onClick={() => navigateWithOfflineCheck(item.path, item.label)}
                className="relative -mt-6 flex flex-col items-center justify-center touch-target focus-ring"
                aria-label={`Go to ${item.label}`}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-red-500 flex items-center justify-center shadow-lg transform transition-transform active:scale-95">
                  <Icon size={24} className="text-white" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigateWithOfflineCheck(item.path, item.label)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 touch-target focus-ring ${
                isActive
                  ? 'text-yellow-600 bg-yellow-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              aria-label={`Go to ${item.label}`}
            >
              <Icon
                size={20}
                className={`mb-1 transition-colors ${
                  isActive ? 'text-yellow-600' : 'text-gray-600'
                }`}
              />
              <span className={`text-xs font-medium ${
                isActive ? 'text-yellow-700' : 'text-gray-600'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
