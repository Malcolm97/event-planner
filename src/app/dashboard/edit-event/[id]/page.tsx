'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, TABLES } from '@/lib/supabase';
import { FiArrowLeft, FiSave, FiCalendar, FiMapPin, FiTag, FiDollarSign, FiFileText, FiAlertCircle, FiCheck, FiEdit3, FiExternalLink } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { triggerCacheRefresh } from '@/hooks/useOfflineFirstData';
import ImageUpload from '@/components/EventFormComponents';
import { FormSection, FormField, LoadingButton, AlertBanner } from '@/components/EventFormComponents';
import CustomSelect from '@/components/CustomSelect';
import SkeletonLoader from '@/components/SkeletonLoader';

export const dynamic = 'force-dynamic';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export default function EditEventPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  
  const { isOnline } = useNetworkStatus();
  const { queueOperation } = useOfflineSync();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState('Port Moresby');
  const [customLocation, setCustomLocation] = useState('');
  const [presalePrice, setPresalePrice] = useState<number>(0);
  const [gatePrice, setGatePrice] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [venue, setVenue] = useState('');
  
  // Image state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  // External links state
  const [externalLinks, setExternalLinks] = useState({
    facebook: '',
    instagram: '',
    tiktok: '',
    website: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Image cleanup ref
  const previewsRef = useRef<string[]>([]);

  const popularPngCities = [
    "Port Moresby", "Lae", "Madang", "Mount Hagen", "Goroka", "Rabaul", "Wewak",
    "Popondetta", "Arawa", "Kavieng", "Daru", "Vanimo", "Kimbe", "Mendi",
    "Kundiawa", "Lorengau", "Wabag", "Kokopo", "Buka", "Alotau", "Other"
  ];

  const categories = [
    { value: 'Music', label: 'Music' },
    { value: 'Art', label: 'Art' },
    { value: 'Food', label: 'Food' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Wellness', label: 'Wellness' },
    { value: 'Comedy', label: 'Comedy' },
    { value: 'Other', label: 'Other' },
  ];

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      previewsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      
      // Clear previous state
      setImageFiles([]);
      previewsRef.current.forEach(url => URL.revokeObjectURL(url));
      previewsRef.current = [];

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/signin');
          return;
        }

        const { data: eventData, error: fetchError } = await supabase
          .from(TABLES.EVENTS)
          .select('*')
          .eq('id', id)
          .eq('created_by', user.id)
          .single();

        if (fetchError) {
          setError(`Error fetching event: ${fetchError.message}`);
          setLoading(false);
          return;
        }

        if (eventData) {
          setName(eventData.name || '');
          setDescription(eventData.description || '');
          setDate(eventData.date ? new Date(eventData.date).toISOString().slice(0, 16) : '');
          setEndDate(eventData.end_date ? new Date(eventData.end_date).toISOString().slice(0, 16) : '');
          setPresalePrice(eventData.presale_price || 0);
          setGatePrice(eventData.gate_price || 0);
          setCategory(eventData.category || '');
          setVenue(eventData.venue || '');
          
          // Handle image URLs - support both array and single string
          const images = Array.isArray(eventData.image_urls) 
            ? eventData.image_urls 
            : (eventData.image_url ? [eventData.image_url] : []);
          setImageUrls(images);

          // Set location
          if (popularPngCities.includes(eventData.location)) {
            setSelectedLocationType(eventData.location);
            setCustomLocation('');
          } else {
            setSelectedLocationType('Other');
            setCustomLocation(eventData.location || '');
          }

          // Set external links
          if (eventData.external_links) {
            setExternalLinks({
              facebook: eventData.external_links.facebook || '',
              instagram: eventData.external_links.instagram || '',
              tiktok: eventData.external_links.tiktok || '',
              website: eventData.external_links.website || ''
            });
          }
        } else {
          setError('Event not found or you do not have permission to edit it.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while fetching event.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id, router]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Event name is required';
    }
    
    if (!description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!date) {
      errors.date = 'Start date is required';
    }

    // Validate end date is after start date
    if (date && endDate) {
      const startDateTime = new Date(date);
      const endDateTime = new Date(endDate);
      
      if (endDateTime <= startDateTime) {
        errors.endDate = 'End date must be after the start date';
      }
    }

    // Validate location
    let finalLocation = selectedLocationType;
    if (selectedLocationType === 'Other') {
      finalLocation = customLocation;
    }
    if (!finalLocation || !finalLocation.trim()) {
      errors.location = 'Please provide a location for the event';
    }
    
    if (!category) {
      errors.category = 'Please select a category';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [name, description, date, endDate, selectedLocationType, customLocation, category]);

  const handleExistingImagesRemove = useCallback((urlToRemove: string) => {
    setImageUrls(prev => prev.filter(url => url !== urlToRemove));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setError(null);
    setSuccessMessage(null);
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to update an event.');
        setSubmitting(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Authentication session expired. Please sign in again.');
        setSubmitting(false);
        return;
      }

      let finalLocation = selectedLocationType;
      if (selectedLocationType === 'Other') {
        finalLocation = customLocation;
      }

      // Handle image uploads
      let finalImageUrls: string[] = [...imageUrls];

      if (imageFiles.length > 0) {
        if (!isOnline) {
          setError('Note: Images will be uploaded when you reconnect to the internet.');
        } else {
          for (const imageFile of imageFiles) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `event-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('event-images')
              .upload(filePath, imageFile, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              setError(`Error uploading image: ${uploadError.message}`);
              setSubmitting(false);
              return;
            }

            const { data: publicUrlData } = supabase.storage
              .from('event-images')
              .getPublicUrl(filePath);

            finalImageUrls.push(publicUrlData.publicUrl);
          }
        }
      }

      // Build external links object (only include non-empty values)
      const externalLinksData: Record<string, string> = {};
      if (externalLinks.facebook?.trim()) {
        externalLinksData.facebook = externalLinks.facebook.trim();
      }
      if (externalLinks.instagram?.trim()) {
        externalLinksData.instagram = externalLinks.instagram.trim();
      }
      if (externalLinks.tiktok?.trim()) {
        externalLinksData.tiktok = externalLinks.tiktok.trim();
      }
      if (externalLinks.website?.trim()) {
        externalLinksData.website = externalLinks.website.trim();
      }

      const updateData = {
        name: name.trim(),
        description: description ? description.trim() : '',
        date,
        end_date: endDate || null,
        location: finalLocation.trim(),
        venue: venue ? venue.trim() : '',
        presale_price: presalePrice || 0,
        gate_price: gatePrice || 0,
        category: category || '',
        image_urls: finalImageUrls.length > 0 ? finalImageUrls : null,
        external_links: externalLinksData,
      };

      // Check if we're online and queue for offline if needed
      if (!isOnline) {
        await queueOperation('update', TABLES.EVENTS, { id, ...updateData });
        setSuccessMessage('Event saved offline. It will be updated when you reconnect.');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
        setSubmitting(false);
        return;
      }

      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update event');
        setSubmitting(false);
        return;
      }

      setSuccessMessage('Event updated successfully!');
      
      // Trigger cache refresh so updated event appears immediately
      triggerCacheRefresh('events');
      
      // Delay redirect to show success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-red-500 to-red-600 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="mb-6">
            <SkeletonLoader className="h-12 w-40 rounded-xl" />
          </div>
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-red-500 px-8 py-8">
              <SkeletonLoader className="h-10 w-48 mx-auto rounded-lg" />
            </div>
            <div className="p-6 sm:p-8 space-y-6">
              <SkeletonLoader className="h-48 w-full rounded-2xl" />
              <SkeletonLoader className="h-48 w-full rounded-2xl" />
              <SkeletonLoader className="h-32 w-full rounded-2xl" />
              <SkeletonLoader className="h-16 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-red-500 to-red-600 pb-12">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-yellow-400/90 backdrop-blur-sm text-yellow-900 px-4 py-3 text-center text-sm font-medium">
          You're offline. Changes will be saved when you reconnect.
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-gray-900 hover:text-white bg-white/90 hover:bg-gray-900 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium"
          >
            <FiArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-red-500 px-8 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiEdit3 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-base sm:text-base lg:text-2xl font-bold text-white mb-2">Edit Event</h1>
            <p className="text-white/80">Update your event details</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Error & Success Messages */}
            {error && (
              <AlertBanner 
                type="error" 
                message={error} 
                onClose={() => setError(null)} 
              />
            )}
            
            {successMessage && (
              <AlertBanner 
                type="success" 
                message={successMessage} 
              />
            )}

            {/* Basic Information */}
            <FormSection
              title="Basic Information"
              description="Tell us about your event"
              icon={<FiFileText size={20} />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField 
                  label="Event Name" 
                  required 
                  error={validationErrors.name}
                  hint="Give your event a catchy name"
                >
                  <input
                    type="text"
                    id="name"
                    className={`input-field ${validationErrors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. PNG Music Festival 2024"
                    maxLength={100}
                    required
                  />
                </FormField>

                <FormField 
                  label="Category" 
                  required 
                  error={validationErrors.category}
                >
                  <CustomSelect
                    value={category}
                    onChange={setCategory}
                    placeholder="Select a category"
                    options={categories}
                    required
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Event Details */}
            <FormSection
              title="Event Details"
              description="Describe what attendees can expect"
              icon={<FiTag size={20} />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField 
                  label="Description" 
                  required 
                  error={validationErrors.description}
                  hint="Describe your event in detail"
                >
                  <textarea
                    id="description"
                    rows={4}
                    className={`input-field resize-none ${validationErrors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's special about this event?"
                    maxLength={2000}
                    required
                  />
                </FormField>

                <div className="space-y-4">
                  <FormField 
                    label="Venue" 
                    hint="Where will the event take place?"
                  >
                    <input
                      type="text"
                      id="venue"
                      className="input-field"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Grand Papua Hotel Ballroom"
                    />
                  </FormField>

                  <FormField 
                    label="Event Images" 
                    hint="Up to 3 images • Max 5MB each"
                  >
                    <ImageUpload
                      images={imageFiles}
                      existingImages={imageUrls}
                      onImagesChange={setImageFiles}
                      onExistingImagesRemove={handleExistingImagesRemove}
                      maxImages={3}
                      showConfirmRemove={true}
                    />
                  </FormField>
                </div>
              </div>
            </FormSection>

            {/* Date & Location */}
            <FormSection
              title="Date & Location"
              description="When and where is your event?"
              icon={<FiCalendar size={20} />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField 
                    label="Start Date & Time" 
                    required 
                    error={validationErrors.date}
                  >
                    <input
                      type="datetime-local"
                      id="date"
                      className={`input-field ${validationErrors.date ? 'border-red-500 focus:ring-red-500' : ''}`}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </FormField>

                  <FormField 
                    label="End Date & Time" 
                    error={validationErrors.endDate}
                    hint="Optional - for multi-day or long events"
                  >
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
                  <FormField 
                    label="Location" 
                    required 
                    error={validationErrors.location}
                  >
                    <CustomSelect
                      value={selectedLocationType}
                      onChange={setSelectedLocationType}
                      placeholder="Select a location"
                      options={popularPngCities.map(city => ({ value: city, label: city }))}
                      required
                    />
                  </FormField>

                  {selectedLocationType === 'Other' && (
                    <FormField 
                      label="Custom Location" 
                      required
                      hint="Enter the location name"
                    >
                      <input
                        type="text"
                        id="customLocation"
                        className="input-field"
                        placeholder="Enter location name"
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                      />
                    </FormField>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Pricing */}
            <FormSection
              title="Pricing"
              description="Set ticket prices for your event"
              icon={<FiDollarSign size={20} />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField 
                  label="Presale Price (PGK)" 
                  hint="Leave empty for free events"
                >
                  <input
                    type="number"
                    id="presalePrice"
                    className="input-field"
                    value={presalePrice || ''}
                    onChange={(e) => setPresalePrice(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </FormField>

                <FormField 
                  label="Gate Price (PGK)" 
                  hint="Leave empty for free events"
                >
                  <input
                    type="number"
                    id="gatePrice"
                    className="input-field"
                    value={gatePrice || ''}
                    onChange={(e) => setGatePrice(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </FormField>
              </div>
            </FormSection>

            {/* External Links */}
            <FormSection
              title="External Event Links"
              description="Add links to where this event is posted on social media"
              icon={<FiExternalLink size={20} />}
            >
              <p className="text-sm text-gray-500 mb-4">
                Link to your event posts on Facebook, Instagram, TikTok, or a website. Users can view your event on these platforms.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField 
                  label="Facebook Event URL"
                  hint="Link to your Facebook event page"
                >
                  <input
                    type="url"
                    id="externalFacebook"
                    className="input-field"
                    value={externalLinks.facebook}
                    onChange={(e) => setExternalLinks(prev => ({ ...prev, facebook: e.target.value }))}
                    placeholder="https://facebook.com/events/..."
                  />
                </FormField>

                <FormField 
                  label="Instagram Post URL"
                  hint="Link to your Instagram event post"
                >
                  <input
                    type="url"
                    id="externalInstagram"
                    className="input-field"
                    value={externalLinks.instagram}
                    onChange={(e) => setExternalLinks(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="https://instagram.com/p/..."
                  />
                </FormField>

                <FormField 
                  label="TikTok URL"
                  hint="Link to your TikTok event video"
                >
                  <input
                    type="url"
                    id="externalTiktok"
                    className="input-field"
                    value={externalLinks.tiktok}
                    onChange={(e) => setExternalLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                    placeholder="https://tiktok.com/@user/video/..."
                  />
                </FormField>

                <FormField 
                  label="Website URL"
                  hint="Link to your event website or ticketing page"
                >
                  <input
                    type="url"
                    id="externalWebsite"
                    className="input-field"
                    value={externalLinks.website}
                    onChange={(e) => setExternalLinks(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://your-event-website.com"
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Submit Button */}
            <div className="pt-4 flex justify-center">
              <LoadingButton
                type="submit"
                loading={submitting}
                loadingText="Saving Changes..."
                icon={<FiSave size={20} />}
                fullWidth
              >
                Save Changes
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
