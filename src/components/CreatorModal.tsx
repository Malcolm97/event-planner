'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User } from '@/lib/supabase';
import { normalizeUser, EventItem } from '@/lib/types';
import { FiChevronRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { storeSigninRedirect, isEventUpcomingOrActive } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/context/NetworkStatusContext';

// Component imports
import CreatorModalHeader from './CreatorModalHeader';
import CreatorAvatarSection from './CreatorAvatarSection';
import CreatorSocialLinks from './CreatorSocialLinks';
import CreatorEventsGallery from './CreatorEventsGallery';

interface CreatorWithEvents extends User {
  eventsCount: number;
  latestEvent?: EventItem;
  allEvents?: EventItem[];
  hasUpcomingEvent?: boolean;
  social_links?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
  };
}

interface CreatorModalProps {
  creator: CreatorWithEvents | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatorModal({ creator, isOpen, onClose }: CreatorModalProps) {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Animation on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    lastActiveElement.current = document.activeElement as HTMLElement;
    if (modalRef.current) modalRef.current.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'Tab') {
        // Trap focus inside modal
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      lastActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !creator) return null;

  // Normalize creator data to handle field name variants (full_name/name, avatar_url/photo_url)
  const normalizedCreator = normalizeUser(creator);
  // Get photo URL from either field
  const creatorPhotoUrl = normalizedCreator.photo_url || normalizedCreator.avatar_url;
  // Get name from either field
  const creatorName = normalizedCreator.name || normalizedCreator.full_name || 'Unnamed Creator';

  // Get up to 4 events for the gallery
  const galleryEvents = creator.allEvents?.slice(0, 4) || [];
  // Use proper timing logic - event is upcoming/current if it hasn't ended yet
  const hasUpcomingEvents = creator.allEvents?.some(e => isEventUpcomingOrActive(e)) || false;

  const handleViewFullProfile = () => {
    sessionStorage.setItem('creatorsScrollPosition', window.scrollY.toString());
    router.push(`/profile/${creator.id}`);
    handleClose();
  };

  const handleSignInClick = () => {
    const currentUrl = window.location.pathname + window.location.search;
    storeSigninRedirect(currentUrl, {
      type: 'creator-modal',
      creatorId: creator.id,
      isOpen: true
    });
    router.push('/signin');
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`fixed inset-x-0 top-14 sm:top-16 lg:top-0 bottom-16 sm:bottom-20 lg:bottom-0 z-50 flex items-center justify-center p-3 sm:p-4 lg:p-6 transition-all duration-300 ${
        isVisible 
          ? 'bg-black/60 backdrop-blur-sm opacity-100' 
          : 'bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none'
      }`}
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
        aria-labelledby="creator-modal-title"
        aria-describedby="creator-modal-desc"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-out ${
          isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-8 opacity-0 scale-95'
        }`}
        style={{ maxHeight: 'calc(90dvh - 3.5rem - 4rem - env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Offline indicator */}
        {!isOnline && (
          <div className="w-full bg-yellow-100 text-yellow-800 text-center py-2 text-sm sm:text-base font-semibold" role="alert">
            You are offline. Creator details may be cached.
          </div>
        )}

        {/* Header with gradient */}
        <CreatorModalHeader onClose={handleClose} />

        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(90dvh - 3.5rem - 4rem - 4rem - env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="p-4 sm:p-5 space-y-4">
            {/* Avatar Section */}
            <CreatorAvatarSection
              name={creatorName}
              company={normalizedCreator.company}
              photoUrl={creatorPhotoUrl}
              eventsCount={creator.eventsCount}
              hasUpcomingEvents={hasUpcomingEvents}
            />

            {/* Social Links */}
            <CreatorSocialLinks
              socialLinks={creator.social_links}
              showSocialLinks={creator.show_social_links}
            />

            {/* Bio */}
            {creator.about && (
              <div className="py-2">
                <p className="text-gray-700 leading-relaxed text-sm">{creator.about}</p>
              </div>
            )}

            {/* Events Gallery */}
            <CreatorEventsGallery
              events={galleryEvents}
              totalEventsCount={creator.eventsCount}
            />

            {/* View Full Profile CTA */}
            <button
              onClick={handleViewFullProfile}
              className="w-full py-3 px-4 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              View Full Profile
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}