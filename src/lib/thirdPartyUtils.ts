/**
 * Third-Party Service Utilities
 * Handles Calendar, Maps, WhatsApp, and other external integrations
 */

import { EventItem } from './types';

// PNG country code
const DEFAULT_COUNTRY_CODE = '675';

/**
 * Format phone number for WhatsApp
 * Handles various formats and adds country code if missing
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If empty after cleaning, return empty
  if (!cleaned) return '';
  
  // Check if it already has a country code
  // PNG numbers are typically 8 digits (without country code)
  // With country code: 675 + 8 digits = 11 digits
  if (cleaned.length <= 8) {
    // No country code, add PNG code
    cleaned = DEFAULT_COUNTRY_CODE + cleaned;
  } else if (cleaned.startsWith('0')) {
    // Starts with 0, remove it and add country code
    cleaned = DEFAULT_COUNTRY_CODE + cleaned.substring(1);
  }
  // If it starts with 675, it's already formatted correctly
  // If it starts with other digits and is longer, assume it has country code
  
  return cleaned;
}

/**
 * Generate WhatsApp URL with optional pre-filled message
 */
export function getWhatsAppUrl(phone: string, message?: string): string {
  const formattedPhone = formatWhatsAppNumber(phone);
  const baseUrl = `https://wa.me/${formattedPhone}`;
  
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  
  return baseUrl;
}

/**
 * Generate event inquiry message for WhatsApp
 */
export function getEventInquiryMessage(eventName: string): string {
  return `Hi! I'm interested in your event "${eventName}". Could you please provide more information?`;
}

/**
 * Format date for calendar (local timezone aware)
 * Returns date in YYYYMMDDTHHmmss format (local time)
 */
export function formatCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Generate Google Calendar URL
 */
export function getGoogleCalendarUrl(event: EventItem): string {
  if (!event?.date) return '';
  
  const startDate = new Date(event.date);
  const endDate = event.end_date ? new Date(event.end_date) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  
  const formatDate = (date: Date) => formatCalendarDate(date);
  
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', event.name || 'Event');
  url.searchParams.set('dates', `${formatDate(startDate)}/${formatDate(endDate)}`);
  
  if (event.location) {
    const locationStr = event.venue ? `${event.venue}, ${event.location}` : event.location;
    url.searchParams.set('location', locationStr);
  }
  
  if (event.description) {
    url.searchParams.set('details', event.description);
  }
  
  return url.toString();
}

/**
 * Generate ICS file content for calendar download
 * Works with Apple Calendar, Outlook, and other calendar apps
 */
export function generateICSContent(event: EventItem): string {
  if (!event?.date) return '';
  
  const startDate = new Date(event.date);
  const endDate = event.end_date ? new Date(event.end_date) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  
  // Format dates for ICS (UTC format)
  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  // Generate a unique ID for the event
  const uid = `${event.id}@pngevents.com`;
  const dtstamp = formatICSDate(new Date());
  const dtstart = formatICSDate(startDate);
  const dtend = formatICSDate(endDate);
  
  // Clean text for ICS format (escape special characters)
  const cleanText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };
  
  const location = event.venue && event.location 
    ? `${cleanText(event.venue)}, ${cleanText(event.location)}`
    : event.location ? cleanText(event.location) : '';
  
  const icsLines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PNG Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${cleanText(event.name || 'Event')}`,
  ];
  
  if (event.description) {
    icsLines.push(`DESCRIPTION:${cleanText(event.description)}`);
  }
  
  if (location) {
    icsLines.push(`LOCATION:${location}`);
  }
  
  icsLines.push(
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  );
  
  const icsContent = icsLines.join('\r\n');
  
  return icsContent;
}

/**
 * Download ICS file for calendar
 */
export function downloadICSFile(event: EventItem): void {
  const icsContent = generateICSContent(event);
  if (!icsContent) return;
  
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.name?.replace(/[^a-z0-9]/gi, '_') || 'event'}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Detect if user is on iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Detect if user is on Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Get directions URL - uses Apple Maps on iOS, Google Maps otherwise
 */
export function getDirectionsUrl(venue?: string, location?: string): string {
  if (!location && !venue) return '';
  
  // Combine venue and location for more specific search
  const searchQuery = venue && location 
    ? `${venue}, ${location}`
    : venue || location || '';
  
  const encodedQuery = encodeURIComponent(searchQuery);
  
  // Use Apple Maps on iOS
  if (isIOS()) {
    return `https://maps.apple.com/?q=${encodedQuery}`;
  }
  
  // Use Google Maps on other platforms
  return `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
}

/**
 * Get geo: URI for native map apps (mobile)
 */
export function getGeoUri(location: string): string {
  return `geo:0,0?q=${encodeURIComponent(location)}`;
}

/**
 * Open directions in appropriate maps app
 */
export function openDirections(venue?: string, location?: string): void {
  const url = getDirectionsUrl(venue, location);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Validate and sanitize URL
 * Returns null if URL is invalid or potentially dangerous
 */
export function sanitizeUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  
  const trimmed = url.trim();
  
  // Check for valid URL format
  try {
    const parsed = new URL(trimmed);
    
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    
    return trimmed;
  } catch {
    // If it doesn't have a protocol, try adding https
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      try {
        const withProtocol = `https://${trimmed}`;
        new URL(withProtocol);
        return withProtocol;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Get social media share URLs
 */
export const shareUrls = {
  facebook: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  twitter: (text: string, url: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  linkedin: (url: string, title: string, summary: string) => 
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  whatsapp: (text: string, url: string) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  email: (subject: string, body: string) => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
};

/**
 * Generate share text for event
 */
export function getEventShareText(event: EventItem): string {
  const dateStr = event.date ? new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) : '';
  
  const eventName = event.name || 'Event';
  return `Check out this event: ${eventName}${event.location ? ` at ${event.location}` : ''}${dateStr ? ` on ${dateStr}` : ''}.`;
}
