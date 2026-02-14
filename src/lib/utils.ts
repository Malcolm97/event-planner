import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { EventItem } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Image utility functions
export function getAllImageUrls(imageUrls: string[] | string | null | undefined): string[] {
  if (!imageUrls) return []
  if (Array.isArray(imageUrls)) return imageUrls
  if (typeof imageUrls === 'string') {
    const trimmed = imageUrls.trim();
    // If the string looks like JSON (array or single-quoted), try to parse it
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed
        if (typeof parsed === 'string') return [parsed]
      } catch (err) {
        // Fall through to return raw string below
        if (process.env.NODE_ENV === 'development') console.log('getAllImageUrls: failed to parse JSON image_urls', err)
      }
    }
    // Otherwise, return the single string as an array
    return [imageUrls]
  }
  return []
}

export function getEventPrimaryImage(event: EventItem): string {
  const images = getAllImageUrls(event?.image_urls)

  // Debug logging to help identify issues
  if (process.env.NODE_ENV === 'development' && images.length === 0) {
    console.debug(`Event "${event?.name || 'Unknown'}" has no parsed images`)
  }

  // Filter out invalid URLs and return the first valid one
  for (const image of images) {
    if (isValidUrl(image)) {
      return image
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Invalid image URL rejected: ${image}`);
      }
    }
  }

  // Fallback to default image if no valid URLs found
  return '/next.svg'
}

export function getValidImageUrls(imageUrls: string[] | string | null | undefined): string[] {
  const images = getAllImageUrls(imageUrls)

  // Filter out invalid URLs and return only valid ones
  return images.filter(image => isValidUrl(image))
}

// Helper function to validate URLs
function isValidUrl(urlString: string): boolean {
  // First check if it's a non-empty string
  if (!urlString || typeof urlString !== 'string' || urlString.trim() === '') {
    return false
  }
  // Accept absolute HTTP/HTTPS URLs
  try {
    const url = new URL(urlString)
    const isValidProtocol = url.protocol === 'http:' || url.protocol === 'https:'
    const hasHostname = Boolean(url.hostname && url.hostname.length > 0)
    const isValid = Boolean(isValidProtocol && hasHostname)
    if (isValid) return true
  } catch {
    // It's not an absolute URL — continue to other checks
  }

  // Accept relative URLs (starting with '/')
  if (urlString.startsWith('/')) return true

  // Accept data URIs and blob URIs
  if (urlString.startsWith('data:') || urlString.startsWith('blob:')) return true

  return false
}

// Auto-sync utility functions
export function isAutoSyncEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const setting = localStorage.getItem('autoSyncEnabled')
    return setting === 'true'
  } catch {
    return false
  }
}

// Signin redirect utilities
export interface ModalState {
  type: 'event-modal' | 'creator-modal'
  eventId?: string
  creatorId?: string
  isOpen?: boolean
  activeTab?: string
}

export function storeSigninRedirect(url: string, modalState?: ModalState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('signinRedirect', url)
    if (modalState) {
      localStorage.setItem('signinModalState', JSON.stringify(modalState))
    }
  } catch (error) {
    console.warn('Failed to store signin redirect:', error)
  }
}

export function getSigninRedirect(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('signinRedirect')
  } catch {
    return null
  }
}

export function getSigninModalState(): ModalState | null {
  if (typeof window === 'undefined') return null
  try {
    const state = localStorage.getItem('signinModalState')
    return state ? JSON.parse(state) : null
  } catch {
    return null
  }
}

export function clearSigninRedirect(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('signinRedirect')
    localStorage.removeItem('signinModalState')
  } catch (error) {
    console.warn('Failed to clear signin redirect:', error)
  }
}

export function safeRedirect(url: string, router: any): void {
  try {
    // Basic URL validation
    if (!url || typeof url !== 'string') {
      router.push('/dashboard')
      return
    }

    // Prevent open redirect vulnerabilities
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // External URL - only allow if it's our domain
      const urlObj = new URL(url)
      if (urlObj.hostname !== window.location.hostname) {
        router.push('/dashboard')
        return
      }
    }

    router.push(url)
  } catch (error) {
    console.warn('Safe redirect failed, using fallback:', error)
    router.push('/dashboard')
  }
}

// Event utility functions
export function isEventCurrentOrUpcoming(event: EventItem): boolean {
  if (!event?.date) return false

  const now = new Date()
  const eventDate = new Date(event.date)

  // Check if event has ended
  if (event.end_date) {
    const endDate = new Date(event.end_date)
    // Event is current if now is between start and end date
    return now >= eventDate && now <= endDate
  }

  // For events without end_date, consider events current if they're within 24 hours of starting
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  return eventDate >= now && eventDate <= twentyFourHoursFromNow
}
