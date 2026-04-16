import type { ExternalLinks } from '@/lib/types';

export interface EventDraftData {
  name: string;
  description: string;
  date: string;
  endDate: string;
  selectedLocationType: string;
  customLocation: string;
  presalePrice: string;
  gatePrice: string;
  category: string;
  venue: string;
  imageUrls?: string[];
  externalLinks: ExternalLinks;
  savedAt: string;
}

export const EMPTY_EVENT_DRAFT: Omit<EventDraftData, 'savedAt'> = {
  name: '',
  description: '',
  date: '',
  endDate: '',
  selectedLocationType: 'Port Moresby',
  customLocation: '',
  presalePrice: '',
  gatePrice: '',
  category: '',
  venue: '',
  imageUrls: [],
  externalLinks: {
    facebook: '',
    instagram: '',
    tiktok: '',
    website: '',
  },
};

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function buildEventDraftKey(scope: 'create' | 'edit', id?: string): string {
  return scope === 'edit' && id ? `event-draft:edit:${id}` : 'event-draft:create';
}

export function saveEventDraft(key: string, data: Omit<EventDraftData, 'savedAt'>): void {
  if (!storageAvailable()) {
    return;
  }

  const payload: EventDraftData = {
    ...data,
    savedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function loadEventDraft(key: string): EventDraftData | null {
  if (!storageAvailable()) {
    return null;
  }

  const value = window.localStorage.getItem(key);
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<EventDraftData>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return {
      ...EMPTY_EVENT_DRAFT,
      ...parsed,
      imageUrls: Array.isArray(parsed.imageUrls) ? parsed.imageUrls.filter((url): url is string => typeof url === 'string') : [],
      externalLinks: {
        ...EMPTY_EVENT_DRAFT.externalLinks,
        ...(parsed.externalLinks || {}),
      },
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearEventDraft(key: string): void {
  if (!storageAvailable()) {
    return;
  }

  window.localStorage.removeItem(key);
}

export function stripDraftMeta(data: EventDraftData | Omit<EventDraftData, 'savedAt'>): Omit<EventDraftData, 'savedAt'> {
  const { savedAt, ...rest } = data as EventDraftData;
  return rest;
}

export function areDraftsEqual(
  left: Omit<EventDraftData, 'savedAt'>,
  right: Omit<EventDraftData, 'savedAt'>
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function hasEventDraftContent(data: Omit<EventDraftData, 'savedAt'>): boolean {
  return Object.entries(data).some(([key, value]) => {
    if (key === 'selectedLocationType') {
      return value !== 'Port Moresby';
    }

    if (key === 'externalLinks') {
      return Object.values(value as ExternalLinks).some((item) => Boolean(item?.trim()));
    }

    if (key === 'imageUrls') {
      return Array.isArray(value) && value.length > 0;
    }

    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  });
}