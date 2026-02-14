'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TABLES } from '@/lib/supabase';
import { FiArrowLeft } from 'react-icons/fi';
import Link from "next/link";
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export default function CreateEventPage() {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const { queueOperation } = useOfflineSync();
  const [user, setUser] = useState<any>(null);
  const [loadingPage, setLoadingPage] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedLocationType, setSelectedLocationType] = useState<string>('Port Moresby');
  const [customLocation, setCustomLocation] = useState<string>('');
  const [presale_price, setPresale_price] = useState<string>('');
  const [gate_price, setGate_price] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

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
    "Port Moresby", "Lae", "Madang", "Mount Hagen", "Goroka",
    "Rabaul", "Wewak", "Popondetta", "Arawa", "Kavieng",
    "Daru", "Vanimo", "Kimbe", "Mendi", "Kundiawa",
    "Lorengau", "Wabag", "Kokopo", "Buka", "Alotau", "Other"
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files).slice(0, 3);
      setImageFiles(fileArray);
      setImageError(null);
    }
  };

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

      // Validate end date is after start date
      if (date && endDate) {
        const startDateTime = new Date(date);
        const endDateTime = new Date(endDate);
        
        if (endDateTime <= startDateTime) {
          setError('End date must be after the start date.');
          setLoading(false);
          return;
        }
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

      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        if (!isOnline) {
          setImageError('Note: Images will be uploaded when you reconnect to the internet.');
        } else {
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

      const eventData = {
        name,
        description,
        date,
        end_date: endDate || null,
        location: finalLocation,
        venue: '',
        presale_price: presale_price === '' ? 0 : parseFloat(presale_price) || 0,
        gate_price: gate_price === '' ? 0 : parseFloat(gate_price) || 0,
        category,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        created_by: user.id,
      };

      await queueOperation('create', TABLES.EVENTS, eventData);

      setName('');
      setDescription('');
      setDate('');
      setEndDate('');
      setSelectedLocationType('Port Moresby');
      setCustomLocation('');
      setPresale_price('');
      setGate_price('');
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-900 hover:text-yellow-400 bg-white bg-opacity-90 px-3 py-2 rounded-lg transition-colors">
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Event</h1>
            <p className="text-gray-600">Fill in the details to create your event</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {imageError && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-yellow-700 text-sm">{imageError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" id="name" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select id="category" className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} required>
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

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea id="description" rows={4} className="input-field resize-none" value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="venue" className="block text-sm font-semibold text-gray-700 mb-1">Venue (optional)</label>
                  <input type="text" id="venue" className="input-field" placeholder="e.g. Grand Papua Hotel Ballroom" />
                  <div className="mt-4">
                    <label htmlFor="images" className="block text-sm font-semibold text-gray-700 mb-2">Event Images (Up to 3)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-yellow-400 transition-colors">
                      <input type="file" id="images" accept="image/*" multiple className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100" onChange={handleImageChange} />
                      <p className="text-xs text-gray-500 mt-2">Optional - You can add images later</p>
                    </div>
                    {imageFiles.length > 0 && (
                      <div className="mt-2 text-sm text-green-600 font-medium">
                        Selected {imageFiles.length} image{imageFiles.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Date & Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-1">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input type="datetime-local" id="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} required />
                  <div className="mt-4">
                    <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-1">End Date & Time (optional)</label>
                    <input type="datetime-local" id="endDate" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <select id="location" className="input-field" value={selectedLocationType} onChange={(e) => setSelectedLocationType(e.target.value)} required>
                    {popularPngCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {selectedLocationType === 'Other' && (
                    <input type="text" id="customLocation" className="input-field mt-3" placeholder="Enter custom location" value={customLocation} onChange={(e) => setCustomLocation(e.target.value)} required />
                  )}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="presale_price" className="block text-sm font-semibold text-gray-700 mb-1">Presale Fee (PGK)</label>
                  <input type="number" id="presale_price" className="input-field" value={presale_price} onChange={(e) => setPresale_price(e.target.value)} min="0" step="0.01" placeholder="Free" />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for Free events</p>
                </div>
                <div>
                  <label htmlFor="gate_price" className="block text-sm font-semibold text-gray-700 mb-1">Gate Fee (PGK)</label>
                  <input type="number" id="gate_price" className="input-field" value={gate_price} onChange={(e) => setGate_price(e.target.value)} min="0" step="0.01" placeholder="Free" />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for Free events</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button type="submit" className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
                {loading ? 'Creating Event...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
