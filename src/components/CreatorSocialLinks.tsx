'use client';

import React from 'react';
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter } from 'react-icons/fa6';

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
}

interface CreatorSocialLinksProps {
  socialLinks?: SocialLinks;
  showSocialLinks?: boolean;
}

export default function CreatorSocialLinks({ socialLinks, showSocialLinks }: CreatorSocialLinksProps) {
  if (showSocialLinks === false || !socialLinks || Object.keys(socialLinks).length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {socialLinks.facebook && (
        <a
          href={socialLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all duration-200 hover:scale-105"
          aria-label="Facebook"
          onClick={(e) => e.stopPropagation()}
        >
          <FaFacebookF size={14} />
        </a>
      )}
      {socialLinks.instagram && (
        <a
          href={socialLinks.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center hover:scale-105 transition-all duration-200"
          aria-label="Instagram"
          onClick={(e) => e.stopPropagation()}
        >
          <FaInstagram size={14} />
        </a>
      )}
      {socialLinks.tiktok && (
        <a
          href={socialLinks.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center hover:bg-gray-800 hover:scale-105 transition-all duration-200"
          aria-label="TikTok"
          onClick={(e) => e.stopPropagation()}
        >
          <FaTiktok size={14} />
        </a>
      )}
      {socialLinks.twitter && (
        <a
          href={socialLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-black hover:scale-105 transition-all duration-200"
          aria-label="Twitter/X"
          onClick={(e) => e.stopPropagation()}
        >
          <FaXTwitter size={14} />
        </a>
      )}
    </div>
  );
}