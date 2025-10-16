import { EventItem } from './types';

// Get the primary image URL for an event
export function getEventPrimaryImage(event: EventItem): string {
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`getEventPrimaryImage called for event "${event?.name || 'unknown'}":`, {
      image_urls: event?.image_urls,
      image_urls_type: typeof event?.image_urls,
      isArray: Array.isArray(event?.image_urls)
    });
  }

  // Check for image_urls first (array format)
  if (event?.image_urls) {
    if (Array.isArray(event.image_urls) && event.image_urls.length > 0) {
      // Filter out empty/null/undefined values and return first valid URL
      const validUrls = event.image_urls.filter(url => url && typeof url === 'string' && url.trim().length > 0);
      if (validUrls.length > 0) {
        const firstUrl = validUrls[0];
        // Use enhanced validation for Supabase URLs
        const normalizedUrl = validateAndNormalizeImageUrl(firstUrl);
        if (normalizedUrl) {
          return normalizedUrl;
        }
      }
    } else if (typeof event.image_urls === 'string' && event.image_urls.trim().length > 0) {
      // Check if it's a JSON string containing an array
      try {
        const parsed = JSON.parse(event.image_urls);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validUrls = parsed.filter(url => url && typeof url === 'string' && url.trim().length > 0);
          if (validUrls.length > 0) {
            const firstUrl = validUrls[0];
            // Use enhanced validation for Supabase URLs
            const normalizedUrl = validateAndNormalizeImageUrl(firstUrl);
            if (normalizedUrl) {
              return normalizedUrl;
            }
          }
        }
      } catch (error) {
        // Not JSON, treat as direct URL string and validate it
        const trimmedUrl = event.image_urls.trim();
        const normalizedUrl = validateAndNormalizeImageUrl(trimmedUrl);
        if (normalizedUrl) {
          return normalizedUrl;
        }
      }
      // If it's a non-empty string but not JSON, validate and return it
      const trimmedUrl = event.image_urls.trim();
      const normalizedUrl = validateAndNormalizeImageUrl(trimmedUrl);
      if (normalizedUrl) {
        return normalizedUrl;
      }
    }
  }

  // For events without images, try to use a placeholder that indicates no image
  // Instead of falling back to '/next.svg', use a more appropriate placeholder
  if (process.env.NODE_ENV === 'development') {
    console.log(`No valid image found for event "${event?.name || 'unknown'}", using placeholder`);
  }

  // Return a placeholder that indicates no image is available
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

// Centralized function to get all image URLs from event data
export function getAllImageUrls(imageUrls: string[] | string | null | undefined): string[] {
  if (!imageUrls) return [];

  if (typeof imageUrls === 'string') {
    try {
      const parsed = JSON.parse(imageUrls);
      if (Array.isArray(parsed)) {
        // Filter out empty/null/undefined values and ensure all are strings
        return parsed.filter(url => url && typeof url === 'string' && url.trim().length > 0);
      }
      // If it's a non-empty string but not JSON, treat as single URL
      return imageUrls.trim() ? [imageUrls.trim()] : [];
    } catch (error) {
      // Not JSON, treat as direct URL string
      return imageUrls.trim() ? [imageUrls.trim()] : [];
    }
  }

  if (Array.isArray(imageUrls)) {
    // Filter out empty/null/undefined values and ensure all are strings
    return imageUrls.filter(url => url && typeof url === 'string' && url.trim().length > 0);
  }

  return [];
}

// Validate if a URL is accessible (basic check)
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsedUrl = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    // Basic validation - has http/https protocol and a valid hostname
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

// Normalize image URL to ensure it has proper protocol and format
export function normalizeImageUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    // Trim whitespace
    const trimmedUrl = url.trim();

    // If it's already a valid URL, return it
    if (isValidImageUrl(trimmedUrl)) {
      return trimmedUrl;
    }

    // Try to construct a full URL if it's a relative path
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const fullUrl = new URL(trimmedUrl, baseUrl);

    // Validate the constructed URL
    if (fullUrl.protocol === 'http:' || fullUrl.protocol === 'https:') {
      return fullUrl.toString();
    }

    return null;
  } catch (error) {
    // If URL construction fails, return null
    console.warn('Failed to normalize image URL:', url, error);
    return null;
  }
}

// Enhanced image URL validation with better Supabase storage support
export function validateAndNormalizeImageUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const trimmedUrl = url.trim();

    // Check if it's a Supabase storage URL
    if (trimmedUrl.includes('supabase.co') && trimmedUrl.includes('/storage/v1/object/public/')) {
      // For Supabase storage URLs, ensure they have the correct format
      return trimmedUrl;
    }

    // For other URLs, use the existing validation
    return normalizeImageUrl(trimmedUrl);
  } catch (error) {
    console.warn('Failed to validate image URL:', url, error);
    return null;
  }
}
