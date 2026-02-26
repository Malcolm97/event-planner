'use client';

import React from 'react';
import { FiX, FiUser } from 'react-icons/fi';

interface CreatorModalHeaderProps {
  onClose: () => void;
}

export default function CreatorModalHeader({ onClose }: CreatorModalHeaderProps) {
  return (
    <div className="relative h-14 sm:h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex-shrink-0">
      {/* Close button */}
      <button
        onClick={onClose}
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
  );
}