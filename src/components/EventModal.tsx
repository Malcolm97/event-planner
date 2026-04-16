 
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { User } from '@/lib/supabase';
import { EventItem } from '@/lib/types';
import EventModalHeader from './EventModalHeader';
import EventModalTabs from './EventModalTabs';
import EventDetailsTab from './EventDetailsTab';
import AboutEventTab from './AboutEventTab';
import HostDetailsTab from './HostDetailsTab';
import ImageModal from './ImageModal';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { getValidImageUrls } from '@/lib/utils';
import '../components/EventModal.animations.css';

interface EventModalProps {
  selectedEvent: EventItem | null;
  host: User | null;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  initialTab?: 'event-details' | 'about-event' | 'host-details';
}

export default function EventModal({ selectedEvent, host, dialogOpen, setDialogOpen, initialTab }: EventModalProps) {
  // Accessibility: focus trap and keyboard navigation
  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<'event-details' | 'about-event' | 'host-details'>('event-details');
  const [imageExpanded, setImageExpanded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!dialogOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen) return;
    lastActiveElement.current = document.activeElement as HTMLElement;
    if (modalRef.current) modalRef.current.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (imageExpanded) {
          setImageExpanded(false);
        } else {
          setDialogOpen(false);
        }
      }
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
  }, [dialogOpen, imageExpanded, setDialogOpen]);

  // Error handling for missing event/host
  useEffect(() => {
    setError(null);
    if (!selectedEvent) {
      setError('No event selected.');
    }
  }, [selectedEvent]);

  // Set initial tab when modal opens and reset when closed
  useEffect(() => {
    if (dialogOpen) {
      setActiveTab(initialTab || 'event-details');
    } else {
      // Reset tab when dialog closes
      setActiveTab('event-details');
    }
  }, [dialogOpen, initialTab]);

  // Reset image modal state when event changes or dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setImageExpanded(false);
      setActiveImageIndex(0);
    }
  }, [selectedEvent, dialogOpen]);

  // Navigation helper functions
  const handlePrevImage = () => {
    const imageUrls = getValidImageUrls(selectedEvent?.image_urls);
    if (imageUrls.length > 0) {
      setActiveImageIndex((prevIndex) => (prevIndex - 1 + imageUrls.length) % imageUrls.length);
    }
  };

  const handleNextImage = () => {
    const imageUrls = getValidImageUrls(selectedEvent?.image_urls);
    if (imageUrls.length > 0) {
      setActiveImageIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
    }
  };

  const handleImageExpand = (index: number) => {
    const imageUrls = getValidImageUrls(selectedEvent?.image_urls);
    if (imageUrls.length === 0) {
      return;
    }
    setActiveImageIndex(Math.max(0, Math.min(index, imageUrls.length - 1)));
    setImageExpanded(true);
  };

  const handleImageSelect = (index: number) => {
    const imageUrls = getValidImageUrls(selectedEvent?.image_urls);
    if (imageUrls.length === 0) {
      return;
    }
    setActiveImageIndex(Math.max(0, Math.min(index, imageUrls.length - 1)));
  };

  if (!dialogOpen) return null;

  if (error) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 md:p-5">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center max-w-sm">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">❌</div>
          <h3 className="text-lg sm:text-xl font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-500 text-sm sm:text-base">{error}</p>
        </div>
      </div>
    );
  }

  if (!selectedEvent) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 md:p-5 lg:p-6 animate-fade-in"
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      aria-labelledby="event-modal-title"
      aria-describedby="event-modal-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget && !imageExpanded) {
          setDialogOpen(false);
        }
      }}
    >
      <p id="event-modal-desc" className="sr-only">
        View event details, about information, host details, and browse event images in a modal dialog.
      </p>
      <div
        className="bg-white rounded-[1.5rem] sm:rounded-[1.75rem] shadow-2xl w-full max-w-[97vw] sm:max-w-3xl md:max-w-[58rem] lg:max-w-5xl mx-auto relative animate-modal-in border border-white/60 overflow-hidden flex flex-col ring-1 ring-black/5"
        style={{
          minHeight: 'auto',
          maxHeight: 'calc(100dvh - 1rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
        }}
      >
        {/* Offline indicator */}
        {!isOnline && (
          <div className="w-full bg-yellow-100 text-yellow-800 text-center py-2 text-sm sm:text-base font-semibold" role="alert">
            You are offline. Event details may be cached.
          </div>
        )}

        {/* Header */}
        <EventModalHeader selectedEvent={selectedEvent} onClose={() => setDialogOpen(false)} />

        {/* Content */}
        <div className="event-card-modal-content flex-1 overflow-y-auto bg-gradient-to-b from-white via-white to-gray-50/70">
          {/* Tab Navigation */}
          <EventModalTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="space-y-4 sm:space-y-6 px-4 sm:px-5 md:px-6 lg:px-7 pb-4 sm:pb-6 md:pb-7">
            {/* Event Details Section */}
            {activeTab === 'event-details' && (
              <div role="tabpanel" id="event-details-panel" aria-labelledby="event-details-tab">
                <EventDetailsTab event={selectedEvent} onImageExpand={handleImageExpand} />
              </div>
            )}

            {/* About Event Section */}
            {activeTab === 'about-event' && (
              <div role="tabpanel" id="about-event-panel" aria-labelledby="about-event-tab">
                <AboutEventTab event={selectedEvent} />
              </div>
            )}

            {/* Host Details Section */}
            {activeTab === 'host-details' && (
              <div role="tabpanel" id="host-details-panel" aria-labelledby="host-details-tab">
                <HostDetailsTab event={selectedEvent} host={host} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Image Modal */}
      {imageExpanded && (
        <ImageModal
          event={selectedEvent}
          activeImageIndex={activeImageIndex}
          onClose={() => setImageExpanded(false)}
          onPrevImage={handlePrevImage}
          onNextImage={handleNextImage}
          onImageSelect={handleImageSelect}
        />
      )}
    </div>
  );
}
