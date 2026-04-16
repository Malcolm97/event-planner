'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiCalendar, FiDollarSign, FiFileText, FiExternalLink, FiTag } from 'react-icons/fi';
import ConfirmLeaveModal from '@/components/ConfirmLeaveModal';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { supabase, TABLES } from '@/lib/supabase';
import { storeSigninRedirect } from '@/lib/utils';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { triggerCacheRefresh } from '@/hooks/useOfflineFirstData';
import ImageUpload, { FormSection, FormField, LoadingButton, AlertBanner } from '@/components/EventFormComponents';
import CustomSelect from '@/components/CustomSelect';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import {
  areDraftsEqual,
  buildEventDraftKey,
  clearEventDraft,
  EMPTY_EVENT_DRAFT,
  hasEventDraftContent,
  loadEventDraft,
  saveEventDraft,
} from '@/lib/eventDraft';
import {
  buildExternalLinksPayload,
  DEFAULT_EXTERNAL_LINKS,
  EVENT_CATEGORY_OPTIONS,
  MAX_EVENT_DESCRIPTION_LENGTH,
  MAX_EVENT_IMAGES,
  MAX_EVENT_NAME_LENGTH,
  POPULAR_PNG_CITIES,
  resolveEventLocation,
  validateEventForm,
} from '@/lib/eventForm';

const FOCUS_ORDER: Array<[string, string]> = [
  ['name', 'name'],
  ['description', 'description'],
  ['date', 'date'],
  ['endDate', 'endDate'],
  ['location', 'customLocation'],
  ['presalePrice', 'presalePrice'],
  ['gatePrice', 'gatePrice'],
  ['external_facebook', 'externalFacebook'],
  ['external_instagram', 'externalInstagram'],
  ['external_tiktok', 'externalTiktok'],
  ['external_website', 'externalWebsite'],
];

export default function CreateEventPage() {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const { queueOperation } = useOfflineSync();
  const draftStorageKey = buildEventDraftKey('create');

  const [loadingPage, setLoadingPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState('Port Moresby');
  const [customLocation, setCustomLocation] = useState('');
  const [presalePrice, setPresalePrice] = useState('');
  const [gatePrice, setGatePrice] = useState('');
  const [category, setCategory] = useState('');
  const [venue, setVenue] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [externalLinks, setExternalLinks] = useState({ ...DEFAULT_EXTERNAL_LINKS });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const currentDraft = useMemo(() => ({
    name,
    description,
    date,
    endDate,
    selectedLocationType,
    customLocation,
    presalePrice,
    gatePrice,
    category,
    venue,
    imageUrls: [] as string[],
    externalLinks,
  }), [
    name,
    description,
    date,
    endDate,
    selectedLocationType,
    customLocation,
    presalePrice,
    gatePrice,
    category,
    venue,
    externalLinks,
  ]);

  const hasUnsavedChanges = hasEventDraftContent(currentDraft) || imageFiles.length > 0;

  const { showModal: showLeaveModal, confirmLeave, cancelLeave, guardedNavigate } = useNavigationGuard(hasUnsavedChanges);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        storeSigninRedirect('/create-event');
        router.push('/signin');
        return;
      }

      setLoadingPage(false);
    };

    checkUser();
  }, [router]);

  useEffect(() => {
    if (loadingPage || hasRestoredDraft) {
      return;
    }

    const savedDraft = loadEventDraft(draftStorageKey);
    if (!savedDraft) {
      setHasRestoredDraft(true);
      return;
    }

    const draftValues = {
      ...EMPTY_EVENT_DRAFT,
      ...savedDraft,
      externalLinks: {
        ...DEFAULT_EXTERNAL_LINKS,
        ...(savedDraft.externalLinks || {}),
      },
    };

    if (!hasEventDraftContent(draftValues)) {
      clearEventDraft(draftStorageKey);
      setHasRestoredDraft(true);
      return;
    }

    setName(draftValues.name);
    setDescription(draftValues.description);
    setDate(draftValues.date);
    setEndDate(draftValues.endDate);
    setSelectedLocationType(draftValues.selectedLocationType);
    setCustomLocation(draftValues.customLocation);
    setPresalePrice(draftValues.presalePrice);
    setGatePrice(draftValues.gatePrice);
    setCategory(draftValues.category);
    setVenue(draftValues.venue);
    setExternalLinks({ ...DEFAULT_EXTERNAL_LINKS, ...draftValues.externalLinks });
    setDraftMessage(`Draft restored from ${new Date(savedDraft.savedAt).toLocaleString()}.`);
    setHasRestoredDraft(true);
  }, [draftStorageKey, hasRestoredDraft, loadingPage]);

  useEffect(() => {
    if (loadingPage || !hasRestoredDraft) {
      return;
    }

    if (!hasEventDraftContent(currentDraft)) {
      clearEventDraft(draftStorageKey);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveEventDraft(draftStorageKey, currentDraft);
      setDraftMessage('Draft saved locally on this device.');
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [currentDraft, draftStorageKey, hasRestoredDraft, loadingPage]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = 'You have unsaved event changes. Are you sure you want to leave?';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const validateForm = useCallback((): boolean => {
    const errors = validateEventForm({
      name,
      description,
      date,
      endDate,
      selectedLocationType,
      customLocation,
      presalePrice: presalePrice === '' ? 0 : parseFloat(presalePrice) || 0,
      gatePrice: gatePrice === '' ? 0 : parseFloat(gatePrice) || 0,
      category,
      externalLinks,
    });

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      const invalidField = FOCUS_ORDER.find(([key]) => errors[key]);
      if (invalidField) {
        requestAnimationFrame(() => {
          const target = document.getElementById(invalidField[1]);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.focus();
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      }
    }

    return Object.keys(errors).length === 0;
  }, [name, description, date, endDate, selectedLocationType, customLocation, presalePrice, gatePrice, category, externalLinks]);

  const handleExistingImagesRemove = useCallback((_url: string) => {
    // Create flow has no persisted images yet.
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setImageError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();

      if (!user || !session) {
        setError('You must be logged in to create an event.');
        setLoading(false);
        return;
      }

      if (!isOnline && imageFiles.length > 0) {
        setError('Images cannot be uploaded while offline yet. Remove the images or reconnect before saving.');
        setLoading(false);
        return;
      }

      const finalLocation = resolveEventLocation(selectedLocationType, customLocation);
      const imageUrls: string[] = [];

      if (imageFiles.length > 0) {
        for (const imageFile of imageFiles) {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, imageFile, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            setImageError(`Warning: Some images may not have uploaded: ${uploadError.message}`);
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);

          imageUrls.push(publicUrlData.publicUrl);
        }
      }

      const eventData = {
        name: name.trim(),
        description: description.trim(),
        date,
        end_date: endDate || null,
        location: finalLocation,
        venue: venue.trim(),
        presale_price: presalePrice === '' ? 0 : parseFloat(presalePrice) || 0,
        gate_price: gatePrice === '' ? 0 : parseFloat(gatePrice) || 0,
        category,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        created_by: user.id,
        external_links: buildExternalLinksPayload(externalLinks),
      };

      if (isOnline) {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          setError(errorData?.userMessage || errorData?.error || 'Failed to create event');
          setLoading(false);
          return;
        }
      } else {
        await queueOperation('create', TABLES.EVENTS, eventData);
      }

      setName('');
      setDescription('');
      setDate('');
      setEndDate('');
      setSelectedLocationType('Port Moresby');
      setCustomLocation('');
      setPresalePrice('');
      setGatePrice('');
      setCategory('');
      setVenue('');
      setImageFiles([]);
      setExternalLinks({ ...DEFAULT_EXTERNAL_LINKS });
      setValidationErrors({});
      clearEventDraft(draftStorageKey);
      setDraftMessage(null);

      setSuccessMessage(isOnline ? 'Event created successfully!' : 'Event saved offline. It will be created when you reconnect.');
      triggerCacheRefresh('events');

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the event');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardDraft = useCallback(() => {
    clearEventDraft(draftStorageKey);
    setName('');
    setDescription('');
    setDate('');
    setEndDate('');
    setSelectedLocationType('Port Moresby');
    setCustomLocation('');
    setPresalePrice('');
    setGatePrice('');
    setCategory('');
    setVenue('');
    setImageFiles([]);
    setExternalLinks({ ...DEFAULT_EXTERNAL_LINKS });
    setValidationErrors({});
    setDraftMessage('Local draft cleared.');
  }, [draftStorageKey]);

  const essentialsComplete = [
    name.trim(),
    description.trim(),
    date,
    category,
    resolveEventLocation(selectedLocationType, customLocation),
  ].filter(Boolean).length;

  if (loadingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-red-500 to-red-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto" />
          <p className="text-white/80 mt-6 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <ConfirmLeaveModal
      open={showLeaveModal}
      onConfirm={confirmLeave}
      onCancel={cancelLeave}
    />
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-red-500 to-red-600 pb-8 sm:pb-10 md:pb-12">
      {!isOnline && (
        <div className="bg-yellow-400/90 backdrop-blur-sm text-yellow-900 px-4 py-3 text-center text-sm font-medium">
          You&apos;re offline. Events can still be queued, but new image uploads require a connection.
        </div>
      )}

      <div className="page-shell max-w-5xl pt-4 sm:pt-6 md:pt-8">
        <div className="mb-4 sm:mb-6">
          <button onClick={() => guardedNavigate('/dashboard')} className="back-button">
            <FiArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-red-500 px-5 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-6 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FiPlus className="h-7 w-7 text-white" />
            </div>
            <h1 className="page-title text-white mb-1">Create New Event</h1>
            <p className="page-subtitle text-white/85">Fill in the details to create an event people can act on quickly</p>
            <div className="mt-4 max-w-md mx-auto rounded-2xl bg-white/15 px-4 py-3 text-left text-white shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>{essentialsComplete}/5 essentials complete</span>
                <span>{Math.round((essentialsComplete / 5) * 100)}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${(essentialsComplete / 5) * 100}%` }} />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-7 lg:p-8 space-y-5 sm:space-y-6">
            {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}
            {successMessage && <AlertBanner type="success" message={successMessage} />}
            {Object.keys(validationErrors).length > 0 && (
              <AlertBanner
                type="warning"
                message={`Please review ${Object.keys(validationErrors).length} highlighted field${Object.keys(validationErrors).length === 1 ? '' : 's'} before submitting.`}
              />
            )}
            {imageError && <AlertBanner type="warning" message={imageError} onClose={() => setImageError(null)} />}
            {draftMessage && <AlertBanner type="info" message={draftMessage} onClose={() => setDraftMessage(null)} />}
            <AlertBanner
              type="info"
              message="High-performing event pages usually include a specific title, exact location, clear timing, transparent pricing, and at least one image."
            />

            {hasUnsavedChanges && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p>Your draft is being saved locally. New image files are not restorable after refresh, so save before leaving if you added images.</p>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="rounded-lg border border-amber-300 px-3 py-2 font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                  >
                    Clear Draft
                  </button>
                </div>
              </div>
            )}

            <FormSection
              title="Basic Information"
              description="Tell people what this event is at a glance"
              icon={<FiFileText size={20} />}
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                <FormField label="Event Name" required error={validationErrors.name} hint="Give your event a clear, searchable name">
                  <input
                    type="text"
                    id="name"
                    className={`input-field ${validationErrors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. PNG Music Festival 2026"
                    maxLength={MAX_EVENT_NAME_LENGTH}
                    required
                  />
                </FormField>

                <FormField label="Category" required error={validationErrors.category}>
                  <CustomSelect
                    value={category}
                    onChange={setCategory}
                    placeholder="Select a category"
                    options={EVENT_CATEGORY_OPTIONS}
                    required
                    error={validationErrors.category}
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Event Details"
              description="Describe what attendees can expect"
              icon={<FiTag size={20} />}
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                <FormField label="Description" required error={validationErrors.description} hint="Use 2-4 concise sentences covering the value and format">
                  <textarea
                    id="description"
                    rows={4}
                    className={`input-field resize-none ${validationErrors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is happening, who it is for, and why someone should attend?"
                    maxLength={MAX_EVENT_DESCRIPTION_LENGTH}
                    required
                  />
                </FormField>

                <div className="space-y-4">
                  <FormField label="Venue" hint="Add the building, hall, or landmark if there is one">
                    <input
                      type="text"
                      id="venue"
                      className="input-field"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Grand Papua Hotel Ballroom"
                    />
                  </FormField>

                  <FormField label="Event Images" hint={`Up to ${MAX_EVENT_IMAGES} images • Max 5MB each`}>
                    <ImageUpload
                      images={imageFiles}
                      existingImages={[]}
                      onImagesChange={setImageFiles}
                      onExistingImagesRemove={handleExistingImagesRemove}
                      maxImages={MAX_EVENT_IMAGES}
                    />
                  </FormField>
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Date & Location"
              description="Make it easy for people to plan"
              icon={<FiCalendar size={20} />}
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                <div className="space-y-4">
                  <FormField label="Start Date & Time" required error={validationErrors.date}>
                    <input
                      type="datetime-local"
                      id="date"
                      className={`input-field ${validationErrors.date ? 'border-red-500 focus:ring-red-500' : ''}`}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </FormField>

                  <FormField label="End Date & Time" error={validationErrors.endDate} hint="Optional, but helpful for multi-day or long events">
                    <input
                      type="datetime-local"
                      id="endDate"
                      className={`input-field ${validationErrors.endDate ? 'border-red-500 focus:ring-red-500' : ''}`}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </FormField>
                </div>

                <div className="space-y-4">
                  <FormField label="Location" required error={validationErrors.location}>
                    <CustomSelect
                      value={selectedLocationType}
                      onChange={setSelectedLocationType}
                      placeholder="Select a location"
                      options={POPULAR_PNG_CITIES.map((city) => ({ value: city, label: city }))}
                      required
                      error={validationErrors.location && selectedLocationType !== 'Other' ? validationErrors.location : undefined}
                    />
                  </FormField>

                  {selectedLocationType === 'Other' && (
                    <FormField label="Custom Location" required error={validationErrors.location} hint="Enter the town, suburb or area name">
                      <LocationAutocomplete
                        id="customLocation"
                        value={customLocation}
                        onChange={setCustomLocation}
                        error={validationErrors.location}
                        required
                      />
                    </FormField>
                  )}
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Pricing"
              description="Set expectations clearly"
              icon={<FiDollarSign size={20} />}
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                <FormField label="Presale Price (PGK)" error={validationErrors.presalePrice} hint="Leave empty for free events">
                  <input
                    type="number"
                    id="presalePrice"
                    className={`input-field ${validationErrors.presalePrice ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={presalePrice}
                    onChange={(e) => setPresalePrice(e.target.value)}
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                  />
                </FormField>

                <FormField label="Gate Price (PGK)" error={validationErrors.gatePrice} hint="Leave empty for free events">
                  <input
                    type="number"
                    id="gatePrice"
                    className={`input-field ${validationErrors.gatePrice ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={gatePrice}
                    onChange={(e) => setGatePrice(e.target.value)}
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="External Event Links"
              description="Add links where this event is already published"
              icon={<FiExternalLink size={20} />}
            >
              <p className="form-hint mb-4">
                Link to your event posts on Facebook, Instagram, TikTok, or a website so attendees can verify details and continue their journey.
              </p>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                <FormField label="Facebook Event URL" error={validationErrors.external_facebook} hint="Link to your Facebook event page">
                  <input
                    type="url"
                    id="externalFacebook"
                    className={`input-field ${validationErrors.external_facebook ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={externalLinks.facebook || ''}
                    onChange={(e) => setExternalLinks((prev) => ({ ...prev, facebook: e.target.value }))}
                    placeholder="https://facebook.com/events/..."
                  />
                </FormField>

                <FormField label="Instagram Post URL" error={validationErrors.external_instagram} hint="Link to your Instagram event post">
                  <input
                    type="url"
                    id="externalInstagram"
                    className={`input-field ${validationErrors.external_instagram ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={externalLinks.instagram || ''}
                    onChange={(e) => setExternalLinks((prev) => ({ ...prev, instagram: e.target.value }))}
                    placeholder="https://instagram.com/p/..."
                  />
                </FormField>

                <FormField label="TikTok URL" error={validationErrors.external_tiktok} hint="Link to your TikTok event video">
                  <input
                    type="url"
                    id="externalTiktok"
                    className={`input-field ${validationErrors.external_tiktok ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={externalLinks.tiktok || ''}
                    onChange={(e) => setExternalLinks((prev) => ({ ...prev, tiktok: e.target.value }))}
                    placeholder="https://tiktok.com/@user/video/..."
                  />
                </FormField>

                <FormField label="Website URL" error={validationErrors.external_website} hint="Link to your event website or ticketing page">
                  <input
                    type="url"
                    id="externalWebsite"
                    className={`input-field ${validationErrors.external_website ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={externalLinks.website || ''}
                    onChange={(e) => setExternalLinks((prev) => ({ ...prev, website: e.target.value }))}
                    placeholder="https://your-event-website.com"
                  />
                </FormField>
              </div>
            </FormSection>

            <div className="pt-4 flex justify-center">
              <LoadingButton type="submit" loading={loading} loadingText="Creating Event..." icon={<FiPlus size={20} />} fullWidth>
                Create Event
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}