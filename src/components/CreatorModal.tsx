'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User } from '@/lib/supabase';
import { 
  FiUser, FiBriefcase, FiMail, FiPhone, 
  FiExternalLink, FiCalendar, FiChevronRight, FiX
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { storeSigninRedirect, isEventUpcomingOrActive } from '@/lib/utils';
import { sanitizeUrl, getWhatsAppUrl } from '@/lib/thirdPartyUtils';

// Base64 encoded SVG for a default user avatar
const DEFAULT_AVATAR_SVG_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIjk5YTNhZiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz4KICA8cGF0aCBkPSJNMTIgMTRjLTQuNDE4IDAtOCAyLjIzOS04IDV2MWgxNnYtMWMwLTIuNzYxLTMuNTgyLTUtOC01eiIvPgo8L3N2Zz4=`;

interface CreatorWithEvents extends User {
  eventsCount: number;
  latestEvent?: any;
  allEvents?: any[];
  hasUpcomingEvent?: boolean;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
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

  const handleViewAllEvents = () => {
    sessionStorage.setItem('creatorsScrollPosition', window.scrollY.toString());
    router.push(`/events?creator=${creator.id}`);
    handleClose();
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
        {/* Header with gradient */}
        <div className="relative h-14 sm:h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex-shrink-0">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all duration-200"
            aria-label="Close modal"
          >
            <FiX size={16} />
          </button>

          {/* Title badge */}
          <div className="absolute bottom-3 left-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/25 backdrop-blur-md text-white text-xs font-medium">
              <FiUser size={12} />
              Event Creator
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(90dvh - 3.5rem - 4rem - 4rem - env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="p-4 sm:p-5 space-y-4">
            {/* Avatar Section */}
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-white p-1 shadow-md">
                  <div className="w-full h-full rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {creator.photo_url ? (
                      <Image
                        src={creator.photo_url}
                        alt={creator.name || 'Creator'}
                        width={72}
                        height={72}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                        <FiUser size={28} className="text-orange-400" />
                      </div>
                    )}
                  </div>
                </div>
                {/* Online/Active indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <h2 id="creator-modal-title" className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {creator.name || 'Unnamed Creator'}
                </h2>
                {creator.company && (
                  <span className="text-gray-600 text-sm truncate block">{creator.company}</span>
                )}
                {/* Stats row */}
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <FiCalendar size={14} />
                    <span className="font-medium">{creator.eventsCount}</span>
                    <span className="hidden sm:inline">events</span>
                  </div>
                  {hasUpcomingEvents && (
                    <div className="flex items-center gap-1.5 text-sm text-green-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Active
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            {creator.show_social_links !== false && creator.social_links && Object.keys(creator.social_links).length > 0 && (
              <div className="flex gap-2">
                {creator.social_links.facebook && (
                  <a
                    href={creator.social_links.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all duration-200 hover:scale-105"
                    aria-label="Facebook"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C23.027 19.612 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {creator.social_links.instagram && (
                  <a
                    href={creator.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center hover:scale-105 transition-all duration-200"
                    aria-label="Instagram"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {creator.social_links.tiktok && (
                  <a
                    href={creator.social_links.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center hover:bg-gray-800 hover:scale-105 transition-all duration-200"
                    aria-label="TikTok"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </a>
                )}
                {creator.social_links.twitter && (
                  <a
                    href={creator.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-black hover:scale-105 transition-all duration-200"
                    aria-label="Twitter/X"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Bio */}
            {creator.about && (
              <div className="py-2">
                <p className="text-gray-700 leading-relaxed text-sm">{creator.about}</p>
              </div>
            )}

            {/* Events Gallery */}
            {galleryEvents.length > 0 && (
              <div className="py-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-500">
                    Events ({creator.eventsCount})
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {galleryEvents.map((event, index) => {
                    // Use proper timing logic - event is upcoming if it hasn't ended yet
                    const isUpcoming = isEventUpcomingOrActive(event);
                    return (
                      <div
                        key={event.id || index}
                        className="relative rounded-xl overflow-hidden group cursor-pointer shadow-md"
                      >
                        <div className="aspect-[4/3] relative">
                          {event.image_url ? (
                            <Image
                              src={event.image_url}
                              alt={event.name || 'Event'}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <FiCalendar size={20} className="text-gray-400" />
                            </div>
                          )}
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                          
                          {/* Upcoming badge */}
                          {isUpcoming && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-[9px] font-bold rounded-full">
                              UPCOMING
                            </div>
                          )}
                        </div>
                        
                        {/* Event info */}
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <p className="text-white font-semibold text-xs truncate">{event.name}</p>
                          {event.date && (
                            <p className="text-white/70 text-[10px] mt-0.5">
                              {new Date(event.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact Section */}
            <div className={`${authUser ? '' : 'bg-gradient-to-br from-gray-50 to-white'} rounded-xl p-4 border border-gray-100`}>
              {authUser ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {creator.email && (
                    <a
                      href={`mailto:${creator.email}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FiMail size={14} className="text-blue-600" />
                      </div>
                      <span className="text-blue-700 text-sm truncate">{creator.email}</span>
                    </a>
                  )}
                  {creator.phone && (
                    <a
                      href={`tel:${creator.phone}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <FiPhone size={14} className="text-green-600" />
                      </div>
                      <span className="text-green-700 text-sm truncate">{creator.phone}</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-gray-500 text-sm mb-3">
                    <span className="font-semibold">Sign in</span> to view contact details
                  </p>
                  <button
                    onClick={handleSignInClick}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium"
                  >
                    Sign In
                    <FiExternalLink size={14} />
                  </button>
                </div>
              )}
            </div>

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
