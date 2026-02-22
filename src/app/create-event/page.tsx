'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TABLES } from '@/lib/supabase';
import { FiArrowLeft, FiPlus, FiCalendar, FiMapPin, FiTag, FiDollarSign, FiFileText, FiAlertCircle, FiCheck, FiExternalLink } from 'react-icons/fi';
import Link from 'next/link';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import ImageUpload from '@/components/EventFormComponents';
import { FormSection, FormField, LoadingButton, AlertBanner, PageHeader } from '@/components/EventFormComponents';
import CustomSelect from '@/components/CustomSelect';

export default function CreateEventPage() {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const { queueOperation } = useOfflineSync();
  
  const [user, setUser] = useState<any>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Form state
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
  
  // Image state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  
  // External links state
  const [externalLinks, setExternalLinks] = useState({
    facebook: '',
    instagram: '',
    tiktok: '',
    website: ''
  });
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Image cleanup ref
  const previewsRef = useRef<string[]>([]);

  const popularPngCities = [
    "Port Moresby", "Lae", "Madang", "Mount Hagen", "Goroka",
    "Rabaul", "Wewak", "Popondetta", "Arawa", "Kavieng",
    "Daru", "Vanimo", "Kimbe", "Mendi", "Kundiawa",
    "Lorengau", "Wabag", "Kokopo", "Buka", "Alotau", "Other"
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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin');
        return;
      }
      setUser(user);
      setLoadingPage(false);
    };
    checkUser();
  }, [router]);

  // Cleanup image previews on unmount
  useEffect(() => {
    return () => {
      previewsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

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

  const handleExistingImagesRemove = useCallback((url: string) => {
    // Not needed for create page, but required by interface
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        setError('You must be logged in to create an event.');
        setLoading(false);
        return;
      }

      let finalLocation = selectedLocationType;
      if (selectedLocationType === 'Other') {
        finalLocation = customLocation;
      }

      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        if (!isOnline) {
          setImageError('Note: Images will be uploaded when you reconnect to the internet.');
        } else {
          for (const imageFile of imageFiles) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${currentUser.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('event-images')
              .upload(filePath, imageFile, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              setImageError(`Warning: Some images may not have uploaded: ${uploadError.message}`);
            } else {
              const { data: publicUrlData } = supabase.storage
                .from('event-images')
                .getPublicUrl(filePath);
              imageUrls.push(publicUrlData.publicUrl);
            }
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

      const eventData = {
        name: name.trim(),
        description: description.trim(),
        date,
        end_date: endDate || null,
        location: finalLocation.trim(),
        venue: venue.trim(),
        presale_price: presalePrice === '' ? 0 : parseFloat(presalePrice) || 0,
        gate_price: gatePrice === '' ? 0 : parseFloat(gatePrice) || 0,
        category,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        created_by: currentUser.id,
        external_links: externalLinksData,
      };

      await queueOperation('create', TABLES.EVENTS, eventData);

      // Reset form
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

      setSuccessMessage('Event created successfully!');
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the event');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-red-500 to-red-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
          <p className="text-white/80 mt-6 text-lg">Loading...</p>
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
          <div className="bg-gradient-to-r from-yellow-400 to-red-500 px-6 py-6 lg:px-8 lg:py-6 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FiPlus className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-base sm:text-base lg:text-xl font-bold text-white mb-1">Create New Event</h1>
            <p className="text-white/80 text-sm">Fill in the details to create your amazing event</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 lg:p-6 space-y-5">
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
            
            {imageError && (
              <AlertBanner 
                type="warning" 
                message={imageError} 
                onClose={() => setImageError(null)} 
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
                      existingImages={[]}
                      onImagesChange={setImageFiles}
                      onExistingImagesRemove={handleExistingImagesRemove}
                      maxImages={3}
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
                    value={presalePrice}
                    onChange={(e) => setPresalePrice(e.target.value)}
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
                    value={gatePrice}
                    onChange={(e) => setGatePrice(e.target.value)}
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
            <div className="pt-4">
              <LoadingButton
                type="submit"
                loading={loading}
                loadingText="Creating Event..."
                icon={<FiPlus size={20} />}
              >
                Create Event
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
