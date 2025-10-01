'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TABLES } from '@/lib/supabase';
import { FiArrowLeft } from 'react-icons/fi';
import Link from "next/link";
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import CustomSelect, { SelectOption } from '@/components/CustomSelect';

export default function CreateEventPage() {
  const router = useRouter();
  const { isOnline } = useNetworkStatus(); // Get the network status
  const { queueOperation } = useOfflineSync();
  const [user, setUser] = useState<any>(null);
  const [loadingPage, setLoadingPage] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [venue, setVenue] = useState<string>('');
  const [selectedLocationType, setSelectedLocationType] = useState<string>('Port Moresby');
  const [customLocation, setCustomLocation] = useState<string>('');
  const [presale_price, setPresale_price] = useState<number>(0);
  const [gate_price, setGate_price] = useState<number>(0);
  const [category, setCategory] = useState<string>('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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



  if (loadingPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-500 mt-6 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const popularPngCities = [
    "Port Moresby",
    "Lae",
    "Madang",
    "Mount Hagen",
    "Goroka",
    "Rabaul",
    "Wewak",
    "Popondetta",
    "Arawa",
    "Kavieng",
    "Daru",
    "Vanimo",
    "Kimbe",
    "Mendi",
    "Kundiawa",
    "Lorengau",
    "Wabag",
    "Kokopo",
    "Buka",
    "Alotau",
    "Other" // Option for custom input
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to create an event.');
        setLoading(false);
        return;
      }

      let finalLocation = selectedLocationType;
      if (selectedLocationType === 'Other') {
        finalLocation = customLocation;
      }

      if (!finalLocation) {
        setError('Please provide a location for the event.');
        setLoading(false);
        return;
      }

      // For offline mode, skip image uploads for now
      if (!isOnline && imageFiles.length > 0) {
        setError('Image uploads are not available offline. Images will be uploaded when you reconnect.');
      }

      let imageUrls: string[] = [];
      if (isOnline && imageFiles.length > 0) {
        for (const imageFile of imageFiles) {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, imageFile, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            setError(`Error uploading image: ${uploadError.message}`);
            setLoading(false);
            return;
          }

          const { data: publicUrlData } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);

          imageUrls.push(publicUrlData.publicUrl);
        }
      }

      const eventData = {
        name,
        description,
        date,
        end_date: endDate || null,
        location: finalLocation,
        venue,
        presale_price,
        gate_price,
        category,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        created_by: user.id,
      };

      // Use queueOperation which handles both online and offline cases
      await queueOperation('create', TABLES.EVENTS, eventData);

      // Clear form and redirect
      setName('');
      setDescription('');
      setDate('');
      setEndDate('');
      setLocation('');
      setVenue('');
      setSelectedLocationType('Port Moresby');
      setCustomLocation('');
      setPresale_price(0);
      setGate_price(0);
      setCategory('');
      setImageFiles([]);

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
  {/* Header removed, now rendered globally in layout */}
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
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Event</h1>
            <p className="text-gray-600 text-lg">Fill in the details to create your event</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Event Basic Information */}
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">Event Name</label>
                  <input
                    type="text"
                    id="name"
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Category"
                    options={[
                      { value: 'Music', label: 'Music', icon: '🎵' },
                      { value: 'Art', label: 'Art', icon: '🎨' },
                      { value: 'Food', label: 'Food', icon: '🍽️' },
                      { value: 'Technology', label: 'Technology', icon: '💻' },
                      { value: 'Wellness', label: 'Wellness', icon: '🧘' },
                      { value: 'Comedy', label: 'Comedy', icon: '🎭' },
                      { value: 'Other', label: 'Other', icon: '📌' }
                    ]}
                    value={category}
                    onChange={setCategory}
                    placeholder="Select a category"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Event Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3">Description</label>
                  <textarea
                    id="description"
                    rows={4}
                    className="input-field resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="venue" className="block text-sm font-semibold text-gray-700 mb-3">Venue (optional)</label>
                  <input
                    type="text"
                    id="venue"
                    className="input-field"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Grand Papua Hotel Ballroom"
                  />
                </div>
                <div>
                  <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Images (Up to 3)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-yellow-400 transition-colors">
                    <input
                    type="file"
                    id="images"
                    accept="image/*"
                    multiple
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 file:transition-colors"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        const fileArray = Array.from(files).slice(0, 3); // Limit to 3 files
                        setImageFiles(fileArray);
                      }
                    }}
                  />
                    <p className="text-xs text-gray-500 mt-3">
                    You can upload up to 3 images. The first image will be the primary image.
                  </p>
                  </div>
                  {imageFiles.length > 0 && (
                    <div className="mt-3 text-sm text-green-600 font-medium">
                      Selected {imageFiles.length} image{imageFiles.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date & Location */}
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                Date & Location
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-3">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    id="date"
                    className="input-field"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                  <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-3 mt-6">End Date & Time <span className="text-xs text-gray-400">(optional)</span></label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    className="input-field"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Location"
                    options={popularPngCities.map(city => ({
                      value: city,
                      label: city,
                      icon: city === 'Other' ? '📍' : '🏙️'
                    }))}
                    value={selectedLocationType}
                    onChange={setSelectedLocationType}
                    placeholder="Select location"
                    searchable={true}
                    required
                  />
                  {selectedLocationType === 'Other' && (
                    <input
                      type="text"
                      id="customLocation"
                      className="input-field mt-3"
                      placeholder="Enter custom location"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                Pricing
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="presale_price" className="block text-sm font-semibold text-gray-700 mb-3">Presale Fee (PGK)</label>
                  <input
                    type="number"
                    id="presale_price"
                    className="input-field"
                    value={presale_price}
                    onChange={(e) => setPresale_price(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-2">If 0 or empty, this event will be marked as "None".</p>
                </div>

                <div>
                  <label htmlFor="gate_price" className="block text-sm font-semibold text-gray-700 mb-3">Gate Fee (PGK)</label>
                  <input
                    type="number"
                    id="gate_price"
                    className="input-field"
                    value={gate_price}
                    onChange={(e) => setGate_price(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-2">If 0 or empty, this event will be marked as "None".</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
