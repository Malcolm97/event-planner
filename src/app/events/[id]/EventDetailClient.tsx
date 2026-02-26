"use client";
// Client Component for Event Detail Page - handles interactivity

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Event, User } from "@/lib/supabase";
import EventModal from "@/components/EventModal";
import Button from "@/components/Button";
import { formatEventDate } from "@/lib/seo";

interface EventDetailClientProps {
  event: Event;
  host: User | null;
}

export default function EventDetailClient({ event, host }: EventDetailClientProps) {
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<'event-details' | 'about-event' | 'host-details'>('event-details');

  // Check for modal state in URL parameters (after sign-in redirect)
  useEffect(() => {
    const modalStateParam = searchParams.get('modalState');
    if (modalStateParam && event) {
      try {
        const modalState = JSON.parse(modalStateParam);
        if (modalState.type === 'event-modal' && modalState.eventId === event.id) {
          setInitialTab(modalState.activeTab || 'event-details');
          setDialogOpen(true);
          // Clean up URL
          const url = new URL(window.location.href);
          url.searchParams.delete('modalState');
          window.history.replaceState({}, '', url.toString());
        }
      } catch (error) {
        console.error('Error parsing modal state:', error);
      }
    }
  }, [searchParams, event]);

  // Format date for display
  const formattedDate = event.date ? formatEventDate(event.date) : null;
  
  // Get image URL
  const imageUrl = event.image_urls && event.image_urls.length > 0 
    ? event.image_urls[0] 
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Event Image */}
      <section className="relative w-full py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-yellow-300 to-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            {/* Category Badge */}
            {event.category && (
              <span className="inline-block px-4 py-1 mb-4 text-sm font-semibold bg-white/20 rounded-full">
                {event.category}
              </span>
            )}
            
            {/* Event Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              {event.name}
            </h1>
            
            {/* Event Date & Location */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg text-white/90">
              {formattedDate && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formattedDate}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Event Details Section */}
      <section className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Image */}
          {imageUrl && (
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg">
              <img
                src={imageUrl}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Event Info Card */}
          <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Event Details</h2>
            
            {/* Description */}
            {event.description && (
              <p className="text-gray-600 mb-6 leading-relaxed">
                {event.description}
              </p>
            )}

            {/* Venue */}
            {event.venue && (
              <div className="mb-4">
                <span className="text-sm text-gray-500">Venue</span>
                <p className="text-gray-900 font-medium">{event.venue}</p>
              </div>
            )}

            {/* Pricing */}
            <div className="mb-6">
              <span className="text-sm text-gray-500">Ticket Prices</span>
              <div className="flex gap-4 mt-1">
                {event.presale_price !== null && event.presale_price !== undefined && (
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Presale: K{event.presale_price}
                  </div>
                )}
                {event.gate_price !== null && event.gate_price !== undefined && (
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Gate: K{event.gate_price}
                  </div>
                )}
                {event.presale_price === null && event.gate_price === null && (
                  <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    Free Entry
                  </div>
                )}
              </div>
            </div>

            {/* View Full Details Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={() => setDialogOpen(true)}
            >
              View Full Event Details
            </Button>
          </div>
        </div>

        {/* SEO-friendly content for search engines */}
        <div className="mt-12 prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            About {event.name}
          </h2>
          <p className="text-gray-600">
            {event.description || `Join us for ${event.name}${event.location ? ` in ${event.location}` : ' in Papua New Guinea'}. 
            ${event.venue ? `The event will be held at ${event.venue}.` : ''} 
            ${formattedDate ? `Mark your calendars for ${formattedDate}.` : ''}`}
          </p>
          
          {event.category && (
            <p className="text-gray-600">
              This event is categorized under {event.category}. Discover more {event.category.toLowerCase()} events 
              in Papua New Guinea on PNG Events.
            </p>
          )}
        </div>
      </section>

      {/* Event Modal */}
      <EventModal 
        selectedEvent={event} 
        host={host} 
        dialogOpen={dialogOpen} 
        setDialogOpen={setDialogOpen}
        initialTab={initialTab}
      />
    </div>
  );
}