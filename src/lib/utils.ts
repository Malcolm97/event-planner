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
  if (typeof imageUrls === 'string') return [imageUrls]
  return []
}

export function getEventPrimaryImage(event: EventItem): string {
  const images = getAllImageUrls(event?.image_urls)

  // Debug logging to help identify issues
  if (process.env.NODE_ENV === 'development') {
    console.log(`Event "${event?.name || 'Unknown'}" image data:`, {
      image_urls: event?.image_urls,
      allImages: images,
      imageCount: images.length,
      hasValidImages: images.some(img => isValidUrl(img))
    });
  }

  // Filter out invalid URLs and return the first valid one
  for (const image of images) {
    if (isValidUrl(image)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Found valid image URL: ${image}`);
      }
      return image
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Invalid image URL rejected: ${image}`);
      }
    }
  }

  // Fallback to default image if no valid URLs found
  if (process.env.NODE_ENV === 'development') {
    console.log('No valid images found, using fallback: /next.svg');
  }
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

  try {
    // Check if it's a valid URL format
    const url = new URL(urlString)

    // Ensure it has a protocol (http or https)
    const isValidProtocol = url.protocol === 'http:' || url.protocol === 'https:'

    // Additional check: ensure it has a hostname
    const hasHostname = Boolean(url.hostname && url.hostname.length > 0)

    const isValid = Boolean(isValidProtocol && hasHostname)

    if (process.env.NODE_ENV === 'development') {
      console.log(`URL validation for "${urlString}":`, { protocol: isValidProtocol, hostname: hasHostname, valid: isValid });
    }

    return isValid
  } catch (error) {
    // If URL constructor throws, it's invalid
    if (process.env.NODE_ENV === 'development') {
      console.log(`URL validation failed for "${urlString}": ${error instanceof Error ? error.message : String(error)}`);
    }
    return false
  }
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

  const eventDate = new Date(event.date)
  const now = new Date()

  // Consider events current if they're within 24 hours of starting
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  return eventDate >= now && eventDate <= twentyFourHoursFromNow
}
