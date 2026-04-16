'use client';

import React from 'react';
import { FiUser, FiCalendar } from 'react-icons/fi';
import Image from 'next/image';

interface CreatorAvatarSectionProps {
  name: string;
  company?: string;
  photoUrl?: string;
  eventsCount: number;
  hasUpcomingEvents: boolean;
}

export default function CreatorAvatarSection({
  name,
  company,
  photoUrl,
  eventsCount,
  hasUpcomingEvents,
}: CreatorAvatarSectionProps) {
  return (
    <div className="flex items-start gap-4 sm:gap-5">
      <div className="relative flex-shrink-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-md ring-1 ring-black/5">
          <div className="w-full h-full rounded-[0.9rem] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={name}
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
        <p className="modal-eyebrow text-gray-400 mb-1">Creator</p>
        <h2 id="creator-modal-title" className="modal-title text-gray-900 truncate">
          {name}
        </h2>
        {company && (
          <span className="modal-subtitle text-gray-600 truncate block mt-1">{company}</span>
        )}
        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-3 mt-2.5">
          <div className="flex items-center gap-1.5 text-sm sm:text-base text-gray-500">
            <FiCalendar size={14} />
            <span className="font-medium">{eventsCount}</span>
            <span className="hidden sm:inline">events</span>
          </div>
          {hasUpcomingEvents && (
            <div className="flex items-center gap-1.5 text-sm sm:text-base text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Active
            </div>
          )}
        </div>
      </div>
    </div>
  );
}