'use client';

import React from 'react';
import { FiX, FiUser } from 'react-icons/fi';

interface CreatorModalHeaderProps {
  onClose: () => void;
}

export default function CreatorModalHeader({ onClose }: CreatorModalHeaderProps) {
  return (
    <div className="relative h-16 sm:h-[4.5rem] bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex-shrink-0">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 touch-target rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Close modal"
      >
        <FiX size={18} />
      </button>

      {/* Title badge */}
      <div className="absolute bottom-3.5 left-4 sm:left-5">
        <div className="inline-flex items-center gap-1.5 modal-pill bg-white/25 backdrop-blur-md text-white shadow-lg">
          <FiUser size={12} />
          Event Creator
        </div>
      </div>
    </div>
  );
}