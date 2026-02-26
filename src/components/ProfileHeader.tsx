'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  FiArrowLeft, FiShare2, FiBriefcase, FiMail, FiPhone, 
  FiCheckCircle, FiCheck
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { User } from '@/lib/supabase';
import { getWhatsAppUrl } from '@/lib/thirdPartyUtils';

// Base64 encoded SVG for a default user avatar
const DEFAULT_AVATAR_SVG_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5YTNhZiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz4KICA8cGF0aCBkPSJNMTIgMTRjLTQuNDE4IDAtOCAyLjIzOS04IDV2MWgxNnYtMWMwLTIuNzYxLTMuNTgyLTUtOC01eiIvPgo8L3N2Zz4=`;

interface ProfileHeaderProps {
  user: User;
  eventsCount: number;
  upcomingCount: number;
  onBack: () => void;
  isVerified?: boolean;
}

export default function ProfileHeader({ 
  user, 
  eventsCount, 
  upcomingCount, 
  onBack,
  isVerified = false 
}: ProfileHeaderProps) {
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const profileUrl = window.location.href;
    
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.name || 'Event Creator'} - Profile`,
          text: `Check out ${user.name || 'this event creator'}'s profile on PNG Events`,
          url: profileUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to copy
      }
    }
    
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setShowShareTooltip(true);
      setTimeout(() => {
        setShowShareTooltip(false);
        setCopied(false);
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setShowShareTooltip(true);
      setTimeout(() => {
        setShowShareTooltip(false);
        setCopied(false);
      }, 2000);
    }
  };

  return (
    <>
      {/* Header with Back Button - Compact */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-gray-600 hover:text-yellow-600 transition-colors text-sm"
            >
              <FiArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            <div className="text-center flex-1 px-2">
              <h1 className="text-sm font-semibold text-gray-900 truncate">
                Creator Profile
              </h1>
            </div>
            
            {/* Share Button */}
            <div className="relative">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-gray-600 hover:text-yellow-600 transition-colors text-sm"
                aria-label="Share profile"
              >
                {copied ? (
                  <>
                    <FiCheck size={16} className="text-green-500" />
                    <span className="hidden sm:inline text-green-600">Copied</span>
                  </>
                ) : (
                  <>
                    <FiShare2 size={16} />
                    <span className="hidden sm:inline">Share</span>
                  </>
                )}
              </button>
              
              {/* Tooltip */}
              {showShareTooltip && (
                <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-20">
                  Link copied!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Profile Section */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Avatar - Smaller */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden border-2 border-white shadow">
                {user.photo_url ? (
                  <Image
                    src={user.photo_url}
                    alt={user.name || 'Creator'}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    priority
                  />
                ) : (
                  <Image
                    src={DEFAULT_AVATAR_SVG_BASE64}
                    alt="Default avatar"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    priority
                  />
                )}
              </div>
              
              {/* Verified Badge */}
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                  <FiCheckCircle size={10} className="text-white" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left w-full min-w-0">
            {/* Name with Stats - Inline */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {user.name || 'Unnamed Creator'}
                </h2>
                {isVerified && (
                  <FiCheckCircle size={14} className="text-blue-500 flex-shrink-0" />
                )}
              </div>
              
              {/* Stats - Inline */}
              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-500">
                <span className="font-medium text-gray-700">{eventsCount}</span>
                <span>events</span>
                <span className="text-gray-300">•</span>
                <span className="text-green-600 font-medium">{upcomingCount}</span>
                <span>upcoming</span>
              </div>
            </div>

            {/* Company */}
            {user.company && (
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-2">
                <FiBriefcase size={12} className="text-gray-400" />
                <span className="text-sm text-gray-600">{user.company}</span>
              </div>
            )}

            {/* Bio - Compact */}
            {user.about && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{user.about}</p>
            )}

            {/* Contact & Social - Inline */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {/* Contact Icons */}
              {user.contact_visibility && (
                <>
                  {user.email && (
                    <a
                      href={`mailto:${user.email}`}
                      className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
                      title={`Email: ${user.email}`}
                    >
                      <FiMail size={14} className="text-blue-600" />
                    </a>
                  )}
                  {user.phone && (
                    <a
                      href={`tel:${user.phone}`}
                      className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors"
                      title={`Phone: ${user.phone}`}
                    >
                      <FiPhone size={14} className="text-green-600" />
                    </a>
                  )}
                  {user.whatsapp_number && (
                    <a
                      href={getWhatsAppUrl(user.whatsapp_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                      title="WhatsApp"
                    >
                      <FaWhatsapp size={14} className="text-emerald-600" />
                    </a>
                  )}
                </>
              )}

              {/* Social Links */}
              {user.show_social_links !== false && user.social_links && Object.keys(user.social_links).length > 0 && (
                <>
                  {user.social_links.facebook && (
                    <a
                      href={user.social_links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
                      aria-label="Facebook"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C23.027 19.612 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {user.social_links.instagram && (
                    <a
                      href={user.social_links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                      aria-label="Instagram"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  {user.social_links.tiktok && (
                    <a
                      href={user.social_links.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
                      aria-label="TikTok"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </a>
                  )}
                  {user.social_links.twitter && (
                    <a
                      href={user.social_links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-colors"
                      aria-label="Twitter/X"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}