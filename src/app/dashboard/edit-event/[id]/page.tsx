'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, TABLES } from '@/lib/supabase';
import { FiArrowLeft, FiX } from 'react-icons/fi';
import Link from "next/link";
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default function EditEventPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [venue, setVenue] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState('Port Moresby');
  const [customLocation, setCustomLocation] = useState('');
  const [presale_price, setPresale_price] = useState<number>(0); // Changed from price
  const [gate_price, setGate_price] = useState<number>(0); // Added gate_price
  const [category, setCategory] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]); // State to hold temporary URLs for new images
  const [imageUrls, setImageUrls] = useState<string[]>([]); // Existing image URLs from DB
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]); // State to track images to delete
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const popularPngCities = [
    "Port Moresby", "Lae", "Madang", "Mount Hagen", "Goroka", "Rabaul", "Wewak",
    "Popondetta", "Arawa", "Kavieng", "Daru", "Vanimo", "Kimbe", "Mendi",
    "Kundiawa", "Lorengau", "Wabag", "Kokopo", "Buka", "Alotau", "Other"
  ];

  useEffect(() => {
    // Cleanup function for object URLs when component unmounts or id changes
    return () => {
      newImagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews]); // Depend on newImagePreviews to revoke URLs when they are no longer needed

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      // Clear any previous new image selections and previews when fetching a new event
      setImageFiles([]);
      newImagePreviews.forEach(url => URL.revokeObjectURL(url)); // Revoke old previews
      setNewImagePreviews([]);
      setImagesToDelete([]); // Clear images to delete

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
          .eq('created_by', user.id) // Ensure only event creator can edit
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
          setPresale_price(eventData.presale_price || 0); // Changed from price
          setGate_price(eventData.gate_price || 0); // Added gate_price
          setCategory(eventData.category || '');
          // Ensure imageUrls is always an array, even if eventData.image_urls is null or undefined
          setImageUrls(Array.isArray(eventData.image_urls) ? eventData.image_urls : (eventData.image_url ? [eventData.image_url] : []));
          setVenue(eventData.venue || '');

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

  const handleDeleteImage = (urlToDelete: string, isNew: boolean = false) => {
    if (isNew) {
      // If it's a new image, remove it from imageFiles and newImagePreviews
      const index = newImagePreviews.indexOf(urlToDelete);
      if (index > -1) {
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
      }
    } else {
      // If it's an existing image, mark it for deletion and remove from imageUrls
      setImagesToDelete(prev => [...prev, urlToDelete]);
      setImageUrls(prev => prev.filter(url => url !== urlToDelete));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFilesArray = Array.from(files);
      const totalCurrentImages = imageUrls.length + imageFiles.length;
      const maxAllowed = 3;
      const remainingSlots = maxAllowed - totalCurrentImages;

      if (remainingSlots <= 0) {
        setError(`You have already reached the maximum number of ${maxAllowed} images.`);
        e.target.value = ''; // Clear the input
        return;
      }

      const filesToProcess = newFilesArray.slice(0, remainingSlots);

      // Generate temporary URLs for new files
      const newPreviews = filesToProcess.map(file => URL.createObjectURL(file));

      setImageFiles(prev => [...prev, ...filesToProcess]);
      setNewImagePreviews(prev => [...prev, ...newPreviews]);
      setError(null); // Clear any previous error
      e.target.value = ''; // Clear the input to allow selecting the same file again if needed
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Revoke object URLs after submission to free up memory
    newImagePreviews.forEach(url => URL.revokeObjectURL(url));
    setNewImagePreviews([]); // Clear previews after submission attempt
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to update an event.');
        setSubmitting(false);
        return;
      }

      let finalLocation = selectedLocationType;
      if (selectedLocationType === 'Other') {
        finalLocation = customLocation;
      }

      if (!finalLocation) {
        setError('Please provide a location for the event.');
        setSubmitting(false);
        return;
      }

      // 1. Handle image deletions first
      if (imagesToDelete.length > 0) {
        const filePathsToDelete = imagesToDelete.map(url => {
          // Extract the file path from the public URL
          const pathSegments = url.split('/');
          // Assuming the path is '.../storage/v1/object/public/event-images/fileName.ext'
          // We need 'event-images/fileName.ext'
          const bucketIndex = pathSegments.indexOf('event-images');
          if (bucketIndex > -1 && bucketIndex + 1 < pathSegments.length) {
            return pathSegments.slice(bucketIndex).join('/');
          }
          return ''; // Should not happen if URLs are consistent
        }).filter(Boolean); // Remove empty strings

        if (filePathsToDelete.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from('event-images')
            .remove(filePathsToDelete);

          if (deleteError) {
            setError(`Error deleting images: ${deleteError.message}`);
            setSubmitting(false);
            return;
          }
        }
      }

      let finalImageUrls: string[] = [...imageUrls]; // Start with currently displayed images (after local deletions)

      // 2. Upload new images
      if (imageFiles.length > 0) {
        for (const imageFile of imageFiles) {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
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

      // 3. Ensure total images do not exceed 3 (if somehow more were added)
      // This scenario should ideally be prevented by the onChange logic,
      // but as a safeguard, keep the most recent 3.

      const { error: updateError } = await supabase
        .from(TABLES.EVENTS)
        .update({
          name,
          description,
          date,
          location: finalLocation,
          venue,
          presale_price, // Changed from price
          gate_price,    // Added gate_price
          category,
          image_urls: finalImageUrls.length > 0 ? finalImageUrls : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('created_by', user.id); // Ensure only event creator can update

      if (updateError) {
        setError(updateError.message);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-500 mt-6 text-lg">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event Basic Information */}
            <div className="p-6 rounded-lg border border-gray-100 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                  <input
                    type="text"
                    id="name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    id="category"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="Music">Music</option>
                    <option value="Art">Art</option>
                    <option value="Food">Food</option>
                    <option value="Technology">Technology</option>
                    <option value="Wellness">Wellness</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="p-6 rounded-lg border border-gray-100 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    id="description"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Images (Up to 3)
                  </label>
                  {imageUrls.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Current images:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={url}
                              alt={`Event image ${index + 1}`}
                              width={100}
                              height={80}
                              className="rounded-md object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(url)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-400"
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    id="images"
                    accept="image/*"
                    multiple
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        const newFiles = Array.from(files);
                        const currentImageCount = imageUrls.length; // imageUrls already reflects deletions
                        const maxNewFiles = 3 - currentImageCount;

                        if (maxNewFiles <= 0) {
                          setError('You have already reached the maximum number of images.');
                          e.target.value = ''; // Clear the input
                          return;
                        }

                        const filesToUpload = newFiles.slice(0, maxNewFiles);
                        setImageFiles(prev => [...prev, ...filesToUpload]);
                        // Optionally, you could also generate temporary URLs here if needed for preview
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can add up to {Math.max(0, 3 - imageUrls.length - imageFiles.length)} more image{Math.max(0, 3 - imageUrls.length - imageFiles.length) !== 1 ? 's' : ''}.
                    The first image will be the primary image.
                  </p>
                  {imageFiles.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected {imageFiles.length} new image{imageFiles.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date & Location */}
            <div className="p-6 rounded-lg border border-gray-100 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Date & Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    id="date"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <select
                    id="location"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={selectedLocationType}
                    onChange={(e) => setSelectedLocationType(e.target.value)}
                    required
                  >
                    {popularPngCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
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
                  <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
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
                  <label htmlFor="presale_price" className="block text-sm font-medium text-gray-700 mb-2">Presale Fee (PGK)</label>
                  <input
                    type="number"
                    id="presale_price"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={presale_price}
                    onChange={(e) => setPresale_price(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">If 0 or empty, this event will be marked as "None".</p>
                </div>

                <div>
                  <label htmlFor="gate_price" className="block text-sm font-medium text-gray-700 mb-2">Gate Fee (PGK)</label>
                  <input
                    type="number"
                    id="gate_price"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={gate_price}
                    onChange={(e) => setGate_price(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">If 0 or empty, this event will be marked as "None".</p>
                </div>
              </div>
            </div>



            <button
              type="submit"
              className="w-full rounded-lg px-6 py-3 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Updating Event...' : 'Update Event'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
