 
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
import { getAllImageUrls } from '@/lib/utils';
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
    lastActiveElement.current = document.activeElement as HTMLElement;
    if (modalRef.current) modalRef.current.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDialogOpen(false);
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
  }, [dialogOpen, setDialogOpen]);

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
    const imageUrls = getAllImageUrls(selectedEvent?.image_urls);
    if (imageUrls.length > 0) {
      setActiveImageIndex((prevIndex) => (prevIndex - 1 + imageUrls.length) % imageUrls.length);
    }
  };

  const handleNextImage = () => {
    const imageUrls = getAllImageUrls(selectedEvent?.image_urls);
    if (imageUrls.length > 0) {
      setActiveImageIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
    }
  };

  const handleImageExpand = (index: number) => {
    setActiveImageIndex(index);
    setImageExpanded(true);
  };

  const handleImageSelect = (index: number) => {
    setActiveImageIndex(index);
  };

  if (!dialogOpen) return null;

  if (error) {
    return (
      <div className="fixed inset-x-0 top-14 sm:top-16 md:top-20 lg:top-0 bottom-16 sm:bottom-20 md:bottom-24 lg:bottom-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-2 sm:p-4">
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
      className="fixed inset-x-0 top-14 sm:top-16 md:top-20 lg:top-0 bottom-16 sm:bottom-20 md:bottom-24 lg:bottom-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-2 sm:p-4 animate-fade-in"
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      aria-labelledby="event-modal-title"
      aria-describedby="event-modal-desc"
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-4xl mx-auto relative animate-modal-in border border-gray-200 overflow-hidden flex flex-col"
        style={{
          minHeight: 'auto',
          maxHeight: 'calc(79dvh - 4rem)',
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
        <div className="event-card-modal-content flex-1 overflow-y-auto">
          {/* Tab Navigation */}
          <EventModalTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="space-y-3 sm:space-y-6 px-2 sm:px-4 md:px-6 pb-3 sm:pb-6">
            {/* Event Details Section */}
            {activeTab === 'event-details' && (
              <EventDetailsTab event={selectedEvent} onImageExpand={handleImageExpand} />
            )}

            {/* About Event Section */}
            {activeTab === 'about-event' && (
              <AboutEventTab event={selectedEvent} />
            )}

            {/* Host Details Section */}
            {activeTab === 'host-details' && (
              <HostDetailsTab event={selectedEvent} host={host} />
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
