'use client';

import Header from '../../components/Header'; // Import your component here to prevent errors on build time and avoid breaking changes when upgrading dependencies
// Note that components should be named with Pascal Case e.g., EventForm, UserProfile etc not underlines ie user_profile for example (as per the NextJS guidelines)
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { TABLES } from '../../lib/supabase';
import { FiArrowLeft } from 'react-icons/fi';
import Link from "next/link";
import { useNetworkStatus } from '../../context/NetworkStatusContext'; // Import the hook

export default function CreateEventPage() {
  const { isOnline } = useNetworkStatus(); // Get the network status

  // If offline, show a message and a back button
  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Offline Mode</h1>
          <p className="text-gray-600">Event creation is not available when offline.</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 text-gray-900 hover:text-yellow-400 bg-white bg-opacity-90 px-3 py-2 rounded-lg transition-colors"
          >
            <FiArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState('Port Moresby'); // Default to a popular city
  const [customLocation, setCustomLocation] = useState(''); // State for custom location input
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null); // New state for image file
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

      let imageUrl: string | null = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images') // Ensure you have a bucket named 'event-images' in Supabase Storage
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
        
        imageUrl = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from(TABLES.EVENTS)
        .insert({
          name,
          description,
          date,
          location: finalLocation, // Use the selected or custom location
          price,
          category,
          image_url: imageUrl, // Save the image URL
          created_by: user.id,
        });

      if (insertError) {
        setError(insertError.message);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
            <p className="text-gray-600 mt-2">Fill in the details to create your event</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">Price (PGK)</label>
              <input
                type="number"
                id="price"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
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

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">Event Image</label>
              <input
                type="file"
                id="image"
                accept="image/*"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg px-6 py-3 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
