
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
  const [loading, setLoading] = useState(false);
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
    setLoading(false);
    if (!selectedEvent) {
      setError('No event selected.');
    }
  }, [selectedEvent]);

  // Set initial tab when modal opens
  useEffect(() => {
    if (dialogOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [dialogOpen, initialTab]);

  // Reset image modal state when event changes
  useEffect(() => {
    setImageExpanded(false);
    setActiveImageIndex(0);
  }, [selectedEvent]);

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

  if (loading) {
    return (
      <div className="fixed inset-x-0 top-16 sm:top-20 lg:top-0 bottom-24 lg:bottom-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md p-2 sm:p-4 md:p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-700">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-x-0 top-16 sm:top-20 lg:top-0 bottom-24 lg:bottom-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md p-2 sm:p-4 md:p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!selectedEvent) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-x-0 top-16 sm:top-20 lg:top-0 bottom-24 lg:bottom-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-fade-in"
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      aria-labelledby="event-modal-title"
      aria-describedby="event-modal-desc"
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto relative animate-modal-in border border-gray-200 overflow-hidden flex flex-col"
        style={{
          minHeight: 'calc(80vh - 6rem)', // Reduced height for mobile - account for header + padding
          maxHeight: 'calc(85vh - 6rem)', // Same calculation for max height
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

// Helper function to get all image URLs
const getAllImageUrls = (imageUrls: string[] | string | null | undefined): string[] => {
  if (!imageUrls) return [];

  if (typeof imageUrls === 'string') {
    try {
      const parsed = JSON.parse(imageUrls);
      return Array.isArray(parsed) ? parsed : [imageUrls];
    } catch (error) {
      return [imageUrls];
    }
  }

  return Array.isArray(imageUrls) ? imageUrls : [];
};
