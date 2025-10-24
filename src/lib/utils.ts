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
  return images.length > 0 ? images[0] : '/next.svg'
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
