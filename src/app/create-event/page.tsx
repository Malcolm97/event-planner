'use client';

import Header from '../../components/Header'; // Import your component here to prevent errors on build time and avoid breaking changes when upgrading dependencies
// Note that components should be named with Pascal Case e.g., EventForm, UserProfile etc not underlines ie user_profile for example (as per the NextJS guidelines)
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { TABLES } from '../../lib/supabase';
import { FiArrowLeft } from 'react-icons/fi';
import Link from "next/link";

export default function CreateEventPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventPrice, setEventPrice] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventImage, setEventImage] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
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

      const eventData = {
        name: eventName,
        description: eventDescription,
        location: customLocation || eventLocation,
        price: parseFloat(eventPrice) || 0,
        date: eventDate && eventTime ? `${eventDate}T${eventTime}` : null,
        image: eventImage || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZXZlbnR8ZW58MHx8MHx8fDA%3D",
        category: eventCategory || "Other",
        created_by: user.id,
        created_at: new Date().toISOString(),
        featured: false,
      };

      if (!eventData.location) {
        setError('Please provide a location for the event.');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from(TABLES.EVENTS)
        .insert(eventData);

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
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                id="description"
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              ></textarea>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                id="date"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <input
                type="time"
                id="time"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                id="location"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                required
              >
                <option value="">Select Location</option>
                {popularPngCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {eventLocation === 'Other' && (
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
                value={eventPrice}
                onChange={(e) => setEventPrice(e.target.value)}
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
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value)}
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
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">Event Image URL</label>
              <input
                type="text"
                id="image"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                value={eventImage}
                onChange={(e) => setEventImage(e.target.value)}
                placeholder="e.g., https://example.com/image.jpg"
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
