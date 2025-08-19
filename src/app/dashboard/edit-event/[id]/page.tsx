'use client';

import Header from '../../../../components/Header';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TABLES } from '../../../../lib/supabase';
import { FiArrowLeft } from 'react-icons/fi';
import Link from "next/link";
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default function EditEventPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState('Port Moresby');
  const [customLocation, setCustomLocation] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // Existing image URL
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
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
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
          setPrice(eventData.price || 0);
          setCategory(eventData.category || '');
          setImageUrl(eventData.image_url || null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      let newImageUrl: string | null = imageUrl;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
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
        
        newImageUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from(TABLES.EVENTS)
        .update({
          name,
          description,
          date,
          location: finalLocation,
          price,
          category,
          image_url: newImageUrl,
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
              {imageUrl && (
                <div className="mb-2">
                  <Image src={imageUrl} alt="Current Event Image" width={150} height={100} objectFit="cover" className="rounded-md" />
                </div>
              )}
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
