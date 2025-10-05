'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User } from '@/lib/supabase';
import { FiUser, FiBriefcase, FiMail, FiPhone, FiArrowLeft, FiExternalLink } from 'react-icons/fi';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { storeSigninRedirect, ModalState } from '@/lib/utils';
import { useNetworkStatus } from '@/context/NetworkStatusContext';

// Base64 encoded SVG for a default user avatar
const DEFAULT_AVATAR_SVG_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5YTNhZiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz4KICA8cGF0aCBkPSJNMTIgMTRjLTQuNDE4IDAtOCAyLjIzOS04IDV2MWgxNnYtMWMwLTIuNzYxLTMuNTgyLTUtOC01eiIvPgo8L3N2Zz4=`;

interface CreatorWithEvents extends User {
  eventsCount: number;
  latestEvent?: any;
}

interface CreatorModalProps {
  creator: CreatorWithEvents | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatorModal({ creator, isOpen, onClose }: CreatorModalProps) {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    lastActiveElement.current = document.activeElement as HTMLElement;
    if (modalRef.current) modalRef.current.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      lastActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !creator) return null;

  const handleViewFullProfile = () => {
    // Store scroll position for back navigation
    sessionStorage.setItem('creatorsScrollPosition', window.scrollY.toString());
    router.push(`/profile/${creator.id}`);
    onClose();
  };

  const handleSignInClick = () => {
    // Store current URL and modal state for redirect after sign-in
    const currentUrl = window.location.pathname + window.location.search;
    storeSigninRedirect(currentUrl, {
      type: 'creator-modal',
      creatorId: creator.id,
      isOpen: true
    });
    router.push('/signin');
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-x-0 top-16 sm:top-20 lg:top-0 bottom-24 lg:bottom-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-fade-in"
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      aria-labelledby="creator-modal-title"
      aria-describedby="creator-modal-desc"
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-2xl mx-auto relative animate-modal-in border border-gray-200 overflow-hidden flex flex-col"
        style={{
          minHeight: 'calc(80vh - 6rem)', // Reduced height for mobile - account for header + padding
          maxHeight: 'calc(85vh - 6rem)', // Same calculation for max height
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <h2 id="creator-modal-title" className="text-lg sm:text-xl font-bold text-gray-900">
            Event Creator
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <FiArrowLeft size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 space-y-4 overflow-y-auto flex-1">
          {/* Creator Profile Section */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden shadow-md border-3 border-white">
                {creator.photo_url ? (
                  <Image
                    src={creator.photo_url}
                    alt={creator.name || 'Creator'}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={DEFAULT_AVATAR_SVG_BASE64}
                    alt="Default avatar"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {creator.name || 'Unnamed Creator'}
              </h3>

              {creator.company && (
                <div className="flex items-center gap-2 mb-2">
                  <FiBriefcase size={16} className="text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{creator.company}</span>
                </div>
              )}

              <div className="text-sm text-gray-600">
                {creator.eventsCount} event{creator.eventsCount !== 1 ? 's' : ''} created
              </div>
            </div>
          </div>

          {/* Bio */}
          {creator.about && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">About</h4>
              <p className="text-gray-700 leading-relaxed">{creator.about}</p>
            </div>
          )}

          {/* Latest Upcoming Event */}
          {creator.latestEvent && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">📅</span>
                Latest Upcoming Event
              </h4>

              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">{creator.latestEvent.name}</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>📍 {creator.latestEvent.location || 'Location TBA'}</div>
                  <div>🕒 {creator.latestEvent.date ? new Date(creator.latestEvent.date).toLocaleDateString() : 'Date TBA'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information - Only for logged-in users */}
          {authUser ? (
            <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {creator.email ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FiMail size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900 text-sm">Email</p>
                      <p className="text-blue-700 font-medium text-sm">{creator.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FiMail size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600 text-sm">Email</p>
                      <p className="text-gray-500 text-sm">Not available</p>
                    </div>
                  </div>
                )}

                {creator.phone ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <FiPhone size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900 text-sm">Phone</p>
                      <p className="text-green-700 font-medium text-sm">{creator.phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FiPhone size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600 text-sm">Phone</p>
                      <p className="text-gray-500 text-sm">Not available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/60 rounded-xl">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-yellow-100 flex items-center justify-center">
                <FiUser size={18} className="text-yellow-600" />
              </div>
              <h4 className="font-semibold text-yellow-900 mb-1 text-base">Sign In Required</h4>
              <p className="text-yellow-800 text-sm mb-4">
                Please <span className="font-bold">log in</span> to your account to view contact information and access full profiles.
              </p>
              <button
                onClick={handleSignInClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
              >
                Sign In
                <FiExternalLink size={14} />
              </button>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
