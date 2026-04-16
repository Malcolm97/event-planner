import type { ExternalLinks } from '@/lib/types';

export const EVENT_CATEGORY_VALUES = [
  'Music',
  'Art',
  'Food',
  'Technology',
  'Wellness',
  'Comedy',
  'Other',
] as const;

export const EVENT_CATEGORY_OPTIONS = EVENT_CATEGORY_VALUES.map((value) => ({
  value,
  label: value,
}));

export interface PNGLocation {
  town: string;
  province: string;
}

/** All PNG towns/cities with their province context for autocomplete suggestions. */
export const PNG_LOCATIONS: PNGLocation[] = [
  // NCD
  { town: 'Port Moresby', province: 'NCD' },
  { town: 'Waigani', province: 'NCD' },
  { town: 'Boroko', province: 'NCD' },
  { town: 'Gordons', province: 'NCD' },
  { town: 'Gerehu', province: 'NCD' },
  { town: 'Tokarara', province: 'NCD' },
  { town: 'Koki', province: 'NCD' },
  // Morobe
  { town: 'Lae', province: 'Morobe' },
  { town: 'Bulolo', province: 'Morobe' },
  { town: 'Wau', province: 'Morobe' },
  { town: 'Finschhafen', province: 'Morobe' },
  { town: 'Salamaua', province: 'Morobe' },
  { town: 'Menyamya', province: 'Morobe' },
  // Madang
  { town: 'Madang', province: 'Madang' },
  { town: 'Bogia', province: 'Madang' },
  { town: 'Ramu', province: 'Madang' },
  { town: 'Bundi', province: 'Madang' },
  // East Sepik
  { town: 'Wewak', province: 'East Sepik' },
  { town: 'Maprik', province: 'East Sepik' },
  { town: 'Ambunti', province: 'East Sepik' },
  // West Sepik (Sandaun)
  { town: 'Vanimo', province: 'West Sepik' },
  { town: 'Telefomin', province: 'West Sepik' },
  { town: 'Aitape', province: 'West Sepik' },
  // Western Highlands
  { town: 'Mount Hagen', province: 'Western Highlands' },
  { town: 'Baiyer', province: 'Western Highlands' },
  { town: 'Mul', province: 'Western Highlands' },
  // Jiwaka
  { town: 'Minj', province: 'Jiwaka' },
  { town: 'Banz', province: 'Jiwaka' },
  { town: 'Anglimp', province: 'Jiwaka' },
  // Eastern Highlands
  { town: 'Goroka', province: 'Eastern Highlands' },
  { town: 'Kainantu', province: 'Eastern Highlands' },
  { town: 'Obura', province: 'Eastern Highlands' },
  // Chimbu (Simbu)
  { town: 'Kundiawa', province: 'Simbu' },
  { town: 'Chuave', province: 'Simbu' },
  { town: 'Kerowagi', province: 'Simbu' },
  // Enga
  { town: 'Wabag', province: 'Enga' },
  { town: 'Wapenamanda', province: 'Enga' },
  { town: 'Kompiam', province: 'Enga' },
  // Southern Highlands
  { town: 'Mendi', province: 'Southern Highlands' },
  { town: 'Ialibu', province: 'Southern Highlands' },
  { town: 'Nipa', province: 'Southern Highlands' },
  // Hela
  { town: 'Tari', province: 'Hela' },
  { town: 'Koroba', province: 'Hela' },
  { town: 'Komo', province: 'Hela' },
  // Western
  { town: 'Daru', province: 'Western' },
  { town: 'Kiunga', province: 'Western' },
  { town: 'Tabubil', province: 'Western' },
  // Gulf
  { town: 'Kerema', province: 'Gulf' },
  { town: 'Kikori', province: 'Gulf' },
  // Central
  { town: 'Bereina', province: 'Central' },
  { town: 'Kwikila', province: 'Central' },
  { town: 'Tapini', province: 'Central' },
  // Milne Bay
  { town: 'Alotau', province: 'Milne Bay' },
  { town: 'Samarai', province: 'Milne Bay' },
  { town: 'Losuia', province: 'Milne Bay' },
  { town: 'Esa\'ala', province: 'Milne Bay' },
  // Oro (Northern)
  { town: 'Popondetta', province: 'Oro' },
  { town: 'Kokoda', province: 'Oro' },
  { town: 'Tufi', province: 'Oro' },
  // Manus
  { town: 'Lorengau', province: 'Manus' },
  { town: 'Lou', province: 'Manus' },
  // New Ireland
  { town: 'Kavieng', province: 'New Ireland' },
  { town: 'Namatanai', province: 'New Ireland' },
  // East New Britain
  { town: 'Kokopo', province: 'East New Britain' },
  { town: 'Rabaul', province: 'East New Britain' },
  { town: 'Kerevat', province: 'East New Britain' },
  // West New Britain
  { town: 'Kimbe', province: 'West New Britain' },
  { town: 'Bialla', province: 'West New Britain' },
  { town: 'Kandrian', province: 'West New Britain' },
  // Bougainville (AROB)
  { town: 'Arawa', province: 'Bougainville' },
  { town: 'Buka', province: 'Bougainville' },
  { town: 'Buin', province: 'Bougainville' },
  { town: 'Panguna', province: 'Bougainville' },
];

export const POPULAR_PNG_CITIES = [
  'Port Moresby',
  'Lae',
  'Madang',
  'Mount Hagen',
  'Goroka',
  'Rabaul',
  'Wewak',
  'Popondetta',
  'Arawa',
  'Kavieng',
  'Daru',
  'Vanimo',
  'Kimbe',
  'Mendi',
  'Kundiawa',
  'Lorengau',
  'Wabag',
  'Kokopo',
  'Buka',
  'Alotau',
  'Other',
] as const;

export const DEFAULT_EXTERNAL_LINKS: ExternalLinks = {
  facebook: '',
  instagram: '',
  tiktok: '',
  website: '',
};

export const MAX_EVENT_IMAGES = 3;
export const MAX_EVENT_NAME_LENGTH = 100;
export const MAX_EVENT_DESCRIPTION_LENGTH = 2000;

export type EventCategoryValue = (typeof EVENT_CATEGORY_VALUES)[number];

export interface EventFormValues {
  name: string;
  description: string;
  date: string;
  endDate: string;
  selectedLocationType: string;
  customLocation: string;
  presalePrice: number;
  gatePrice: number;
  category: string;
  externalLinks: ExternalLinks;
}

export function resolveEventLocation(selectedLocationType: string, customLocation: string): string {
  if (selectedLocationType === 'Other') {
    return customLocation.trim();
  }

  return selectedLocationType.trim();
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeExternalLinks(input: unknown): Record<string, string> | null {
  if (!input) {
    return null;
  }

  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('external_links must be an object');
  }

  const allowedKeys = ['facebook', 'instagram', 'tiktok', 'website'] as const;
  const links: Record<string, string> = {};

  for (const key of allowedKeys) {
    const value = (input as Record<string, unknown>)[key];
    if (typeof value !== 'string') {
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    if (!isValidHttpUrl(trimmed)) {
      throw new Error(`Invalid URL for ${key}`);
    }

    links[key] = trimmed;
  }

  return Object.keys(links).length > 0 ? links : null;
}

export function buildExternalLinksPayload(externalLinks: ExternalLinks): Record<string, string> | null {
  return sanitizeExternalLinks(externalLinks);
}

export function validateEventForm(values: EventFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = 'Event name is required';
  } else if (values.name.trim().length > MAX_EVENT_NAME_LENGTH) {
    errors.name = `Event name must be ${MAX_EVENT_NAME_LENGTH} characters or fewer`;
  }

  if (!values.description.trim()) {
    errors.description = 'Description is required';
  } else if (values.description.trim().length > MAX_EVENT_DESCRIPTION_LENGTH) {
    errors.description = `Description must be ${MAX_EVENT_DESCRIPTION_LENGTH} characters or fewer`;
  }

  if (!values.date) {
    errors.date = 'Start date is required';
  }

  if (values.date && values.endDate) {
    const startDateTime = new Date(values.date);
    const endDateTime = new Date(values.endDate);

    if (endDateTime <= startDateTime) {
      errors.endDate = 'End date must be after the start date';
    }
  }

  const finalLocation = resolveEventLocation(values.selectedLocationType, values.customLocation);
  if (!finalLocation) {
    errors.location = 'Please provide a location for the event';
  }

  if (!values.category) {
    errors.category = 'Please select a category';
  } else if (!EVENT_CATEGORY_VALUES.includes(values.category as EventCategoryValue)) {
    errors.category = 'Please select a valid category';
  }

  if (values.presalePrice < 0) {
    errors.presalePrice = 'Presale price cannot be negative';
  }

  if (values.gatePrice < 0) {
    errors.gatePrice = 'Gate price cannot be negative';
  }

  if (values.presalePrice > 0 && values.gatePrice > 0 && values.presalePrice > values.gatePrice) {
    errors.presalePrice = 'Presale price cannot be greater than gate price';
    errors.gatePrice = 'Gate price must be greater than or equal to presale price';
  }

  for (const [key, value] of Object.entries(values.externalLinks)) {
    const trimmed = value?.trim();
    if (!trimmed) {
      continue;
    }

    if (!isValidHttpUrl(trimmed)) {
      errors[`external_${key}`] = `Please enter a valid ${key} URL starting with http:// or https://`;
    }
  }

  return errors;
}