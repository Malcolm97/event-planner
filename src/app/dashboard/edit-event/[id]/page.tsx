'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, TABLES } from '@/lib/supabase';
import { FiArrowLeft, FiX, FiImage, FiCheck, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import SkeletonLoader from '@/components/SkeletonLoader';
import CustomSelect from '@/components/CustomSelect';
import { SelectOption } from '@/components/CustomSelect';

export const dynamic = 'force-dynamic';

// Allowed image types and max file size (5MB)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export default function EditEventPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  
  // Network and offline support
  const { isOnline } = useNetworkStatus();
  const { queueOperation } = useOfflineSync();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [venue, setVenue] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState('Port Moresby');
  const [customLocation, setCustomLocation] = useState('');
  const [presale_price, setPresale_price] = useState<number>(0);
  const [gate_price, setGate_price] = useState<number>(0);
  const [category, setCategory] = useState('');
  
  // Image state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  // Refs for memory management
  const newImagePreviewsRef = useRef<string[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const popularPngCities = [
    "Port Moresby", "Lae", "Madang", "Mount Hagen", "Goroka", "Rabaul", "Wewak",
    "Popondetta", "Arawa", "Kavieng", "Daru", "Vanimo", "Kimbe", "Mendi",
    "Kundiawa", "Lorengau", "Wabag", "Kokopo", "Buka", "Alotau", "Other"
  ];

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      newImagePreviewsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Sync ref with state
  useEffect(() => {
    newImagePreviewsRef.current = newImagePreviews;
  }, [newImagePreviews]);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      
      // Clear previous state
      setImageFiles([]);
      newImagePreviewsRef.current.forEach(url => URL.revokeObjectURL(url));
      newImagePreviewsRef.current = [];
      setNewImagePreviews([]);
      setImagesToDelete([]);

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
          setPresale_price(eventData.presale_price || 0);
          setGate_price(eventData.gate_price || 0);
          setCategory(eventData.category || '');
          setVenue(eventData.venue || '');
          setImageUrls(Array.isArray(eventData.image_urls) ? eventData.image_urls : (eventData.image_url ? [eventData.image_url] : []));

          if (popularPngCities.includes(eventData.location)) {
            setSelectedLocationType(eventData.location);
            setCustomLocation('');
          } else {
            setSelectedLocationType('Other');
            setCustomLocation(eventData.location || '');
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

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle image deletion
  const handleDeleteImage = (urlToDelete: string, isNew: boolean = false) => {
    if (isNew) {
      const index = newImagePreviews.indexOf(urlToDelete);
      if (index > -1) {
        // Revoke the URL to free memory
        URL.revokeObjectURL(newImagePreviews[index]);
        newImagePreviewsRef.current = newImagePreviewsRef.current.filter((_, i) => i !== index);
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
      }
    } else {
      setImagesToDelete(prev => [...prev, urlToDelete]);
      setImageUrls(prev => prev.filter(url => url !== urlToDelete));
    }
  };

  // Validate image file
  const validateImageFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `Invalid file type: ${file.name}. Only JPG, PNG, GIF, and WebP are allowed.`;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return `File too large: ${file.name}. Maximum size is 5MB.`;
    }
    return null;
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFilesArray = Array.from(files);
      const totalCurrentImages = imageUrls.length + imageFiles.length;
      const maxAllowed = 3;
      const remainingSlots = maxAllowed - totalCurrentImages;

      if (remainingSlots <= 0) {
        setError(`You have already reached the maximum number of ${maxAllowed} images.`);
        e.target.value = '';
        return;
      }

      // Validate all files first
      const validationErrors: string[] = [];
      for (const file of newFilesArray) {
        const error = validateImageFile(file);
        if (error) {
          validationErrors.push(error);
        }
      }

      if (validationErrors.length > 0) {
        setError(validationErrors[0]);
        e.target.value = '';
        return;
      }

      const filesToProcess = newFilesArray.slice(0, remainingSlots);
      const newPreviews = filesToProcess.map(file => URL.createObjectURL(file));

      newImagePreviewsRef.current = [...newImagePreviewsRef.current, ...newPreviews];
      setImageFiles(prev => [...prev, ...filesToProcess]);
      setNewImagePreviews(prev => [...prev, ...newPreviews]);
      setError(null);
      e.target.value = '';
    }
  };

  // Handle form submission
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

    // Revoke object URLs
    newImagePreviewsRef.current.forEach(url => URL.revokeObjectURL(url));
    newImagePreviewsRef.current = [];
    setNewImagePreviews([]);
    
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
        // Check network status for image uploads
        if (!isOnline) {
          setError('Note: Images will be uploaded when you reconnect to the internet.');
        } else {
          for (const imageFile of imageFiles) {
            const fileExt = imageFile.name.split('.').pop();
            // Use same format as create-event: user.id/filename
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

      const updateData = {
        name: name.trim(),
        description: description ? description.trim() : '',
        date,
        end_date: endDate || null,
        location: finalLocation.trim(),
        venue: venue ? venue.trim() : '',
        presale_price: presale_price || 0,
        gate_price: gate_price || 0,
        category: category || '',
        image_urls: finalImageUrls.length > 0 ? finalImageUrls : null,
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

      // Handle image deletion from storage
      if (imagesToDelete.length > 0) {
        const filePathsToDelete = imagesToDelete.map(url => {
          const pathSegments = url.split('/');
          const bucketIndex = pathSegments.indexOf('event-images');
          if (bucketIndex > -1 && bucketIndex + 1 < pathSegments.length) {
            return pathSegments.slice(bucketIndex).join('/');
          }
          return '';
        }).filter(Boolean);

        if (filePathsToDelete.length > 0) {
          supabase.storage
            .from('event-images')
            .remove(filePathsToDelete)
            .catch(deleteError => {
              console.error('Error deleting old images:', deleteError);
            });
        }
      }

      setSuccessMessage('Event updated successfully!');
      
      // Delay redirect to show success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <SkeletonLoader className="h-10 w-40" />
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <SkeletonLoader className="h-10 w-48 mx-auto mb-6" />
            <div className="space-y-6">
              <SkeletonLoader className="h-64 w-full" />
              <SkeletonLoader className="h-48 w-full" />
              <SkeletonLoader className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalImages = imageUrls.length + imageFiles.length;
  const remainingSlots = 3 - totalImages;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Offline indicator */}
        {!isOnline && (
          <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FiAlertCircle size={18} />
            <span>You're offline. Changes will be saved when you reconnect.</span>
          </div>
        )}

        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-900 hover:text-yellow-400 bg-white bg-opacity-90 px-3 py-2 rounded-lg transition-colors"
          >
            <FiArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-4 mt-4 border border-gray-200">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
            <p className="text-gray-600 mt-2">Update your event details</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <FiAlertCircle className="text-red-500 mt-0.5" size={18} />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <FiCheck className="text-green-500" size={18} />
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Validation errors */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <ul className="text-sm text-yellow-700 list-disc list-inside">
                {Object.values(validationErrors).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event Basic Information */}
            <div className="p-6 rounded-lg border border-gray-100 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Category"
                    value={category}
                    onChange={setCategory}
                    placeholder="Select a category"
                    required
                    error={validationErrors.category}
                    options={[
                      { value: 'Music', label: 'Music' },
                      { value: 'Art', label: 'Art' },
                      { value: 'Food', label: 'Food' },
                      { value: 'Technology', label: 'Technology' },
                      { value: 'Wellness', label: 'Wellness' },
                      { value: 'Comedy', label: 'Comedy' },
                      { value: 'Other', label: 'Other' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="p-6 rounded-lg border border-gray-100 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Images ({totalImages}/3)
                  </label>
                  
                  {/* Current Images from Database */}
                  {imageUrls.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Current images (click X to remove):</p>
                      <div className="grid grid-cols-3 gap-2">
                        {imageUrls.map((url, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <Image
                              src={url}
                              alt={`Event image ${index + 1}`}
                              width={100}
                              height={80}
                              className="rounded-md object-cover w-full h-20"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(url, false)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-400"
                              title="Remove image"
                              aria-label={`Remove image ${index + 1}`}
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Images Preview */}
                  {newImagePreviews.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">New images to upload (click X to remove):</p>
                      <div className="grid grid-cols-3 gap-2">
                        {newImagePreviews.map((previewUrl, index) => (
                          <div key={`new-${index}`} className="relative group">
                            <img
                              src={previewUrl}
                              alt={`New image ${index + 1}`}
                              className="rounded-md object-cover w-full h-20"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(previewUrl, true)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-400"
                              title="Remove image"
                              aria-label={`Remove new image ${index + 1}`}
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File Input - Only show if we can add more images */}
                  {remainingSlots > 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-yellow-400 transition-colors">
                      <input
                        type="file"
                        id="images"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        aria-label="Upload event images"
                      />
                      <label htmlFor="images" className="cursor-pointer">
                        <FiImage className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500 block">
                          Click to add up to {remainingSlots} more image{remainingSlots > 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-400 block mt-1">
                          JPG, PNG, GIF, WebP (max 5MB each)
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-2 bg-gray-100 rounded-lg">
                      Maximum of 3 images reached
                    </div>
                  )}

                  {/* Image count indicator */}
                  {totalImages > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {totalImages} of 3 images selected
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Date & Location */}
            <div className="p-6 rounded-lg border border-gray-100 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Date & Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="date"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    aria-required="true"
                  />
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                    End Date & Time <span className="text-xs text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    className={`w-full rounded-lg border px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                      validationErrors.endDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    aria-describedby={validationErrors.endDate ? 'endDate-error' : undefined}
                  />
                  {validationErrors.endDate && (
                    <p id="endDate-error" className="text-red-500 text-xs mt-1">
                      {validationErrors.endDate}
                    </p>
                  )}
                </div>

                <div>
                  <CustomSelect
                    label="Location"
                    value={selectedLocationType}
                    onChange={setSelectedLocationType}
                    placeholder="Select a location"
                    required
                    error={validationErrors.location}
                    options={popularPngCities.map(city => ({ value: city, label: city }))}
                  />
                  {selectedLocationType === 'Other' && (
                    <input
                      type="text"
                      id="customLocation"
                      className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="Enter custom location"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div>
                  <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                    Venue <span className="text-xs text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="venue"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="Enter venue name"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="p-6 rounded-lg border border-gray-100 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="presale_price" className="block text-sm font-medium text-gray-700 mb-2">
                    Presale Fee (PGK)
                  </label>
                  <input
                    type="number"
                    id="presale_price"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={presale_price || ''}
                    onChange={(e) => setPresale_price(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="Free"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for Free events</p>
                </div>

                <div>
                  <label htmlFor="gate_price" className="block text-sm font-medium text-gray-700 mb-2">
                    Gate Fee (PGK)
                  </label>
                  <input
                    type="number"
                    id="gate_price"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={gate_price || ''}
                    onChange={(e) => setGate_price(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="Free"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for Free events</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg px-6 py-3 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Updating Event...
                </>
              ) : (
                'Update Event'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
