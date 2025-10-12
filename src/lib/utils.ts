import { EventItem } from './types';

// Get the primary image URL for an event
export function getEventPrimaryImage(event: EventItem): string {
  if (!event.image_urls) return '/next.svg';

  if (typeof event.image_urls === 'string') {
    // Check if it's a JSON string containing an array
    try {
      const parsed = JSON.parse(event.image_urls);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch (error) {
      // Not JSON, treat as direct URL string
    }
    // Return the string as-is (it's a direct URL)
    return event.image_urls;
  }

  if (Array.isArray(event.image_urls) && event.image_urls.length > 0) {
    return event.image_urls[0];
  }

  return '/next.svg';
}

// Sign-in redirect utilities
export const REDIRECT_URL_KEY = 'signinRedirectUrl';
export const MODAL_STATE_KEY = 'signinModalState';
export const REDIRECT_TIMESTAMP_KEY = 'signinRedirectTimestamp';

// Maximum age for stored redirect data (24 hours)
const MAX_REDIRECT_AGE = 24 * 60 * 60 * 1000;

export interface ModalState {
  type: 'creator-modal' | 'event-modal';
  creatorId?: string;
  eventId?: string;
  activeTab?: 'event-details' | 'about-event' | 'host-details';
  isOpen?: boolean;
}

export function storeSigninRedirect(url: string, modalState?: ModalState) {
  if (typeof window === 'undefined') return;

  try {
    // Validate URL
    new URL(url, window.location.origin);

    sessionStorage.setItem(REDIRECT_URL_KEY, url);
    sessionStorage.setItem(REDIRECT_TIMESTAMP_KEY, Date.now().toString());

    if (modalState) {
      // Validate modal state structure
      if (modalState.type && ['creator-modal', 'event-modal'].includes(modalState.type)) {
        sessionStorage.setItem(MODAL_STATE_KEY, JSON.stringify(modalState));
      }
    }
  } catch (error) {
    console.warn('Invalid redirect URL provided:', url);
  }
}

export function getSigninRedirect(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const url = sessionStorage.getItem(REDIRECT_URL_KEY);
    const timestamp = sessionStorage.getItem(REDIRECT_TIMESTAMP_KEY);

    if (!url || !timestamp) return null;

    // Check if redirect data is too old
    const age = Date.now() - parseInt(timestamp);
    if (age > MAX_REDIRECT_AGE) {
      clearSigninRedirect();
      return null;
    }

    // Validate URL is still valid
    new URL(url, window.location.origin);
    return url;
  } catch (error) {
    console.warn('Stored redirect URL is invalid, clearing:', error);
    clearSigninRedirect();
    return null;
  }
}

export function getSigninModalState(): ModalState | null {
  if (typeof window === 'undefined') return null;

  try {
    const state = sessionStorage.getItem(MODAL_STATE_KEY);
    const timestamp = sessionStorage.getItem(REDIRECT_TIMESTAMP_KEY);

    if (!state || !timestamp) return null;

    // Check if modal state is too old
    const age = Date.now() - parseInt(timestamp);
    if (age > MAX_REDIRECT_AGE) {
      clearSigninRedirect();
      return null;
    }

    const parsedState = JSON.parse(state);

    // Validate modal state structure
    if (parsedState.type && ['creator-modal', 'event-modal'].includes(parsedState.type)) {
      return parsedState as ModalState;
    }

    return null;
  } catch (error) {
    console.warn('Stored modal state is invalid, clearing:', error);
    clearSigninRedirect();
    return null;
  }
}

export function clearSigninRedirect() {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(REDIRECT_URL_KEY);
  sessionStorage.removeItem(MODAL_STATE_KEY);
  sessionStorage.removeItem(REDIRECT_TIMESTAMP_KEY);
}

// Utility to check if we have valid redirect data
export function hasValidSigninRedirect(): boolean {
  return getSigninRedirect() !== null;
}

// Safe redirect function with error handling
export function safeRedirect(url: string, router: any, fallbackUrl: string = '/dashboard') {
  try {
    // Validate URL
    new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    // Use Next.js router for client-side navigation
    router.push(url);
  } catch (error) {
    console.warn('Redirect failed, using fallback:', error);
    router.push(fallbackUrl);
  }
}

// Check if an event is current or upcoming (including today, ignoring time)
export function isEventCurrentOrUpcoming(event: any): boolean {
  if (!event.date) return false;
  const eventDate = new Date(event.date);
  const today = new Date();
  // Set time to start of day for comparison
  const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return eventDateOnly >= todayOnly;
}

// Check if auto sync is enabled
export function isAutoSyncEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('autoSync') !== 'false';
}
