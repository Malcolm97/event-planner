"use client";
import Header from "../../components/Header";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, TABLES } from "../../lib/supabase";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function CreateEventPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventPrice, setEventPrice] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventImage, setEventImage] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (!user) {
        setError("You must be signed in to create an event");
        return;
      }

      const eventData = {
        name: eventName,
        description: eventDescription,
        location: customLocation || eventLocation,
        price: parseFloat(eventPrice) || 0,
        date: eventDate ? new Date(eventDate).toISOString() : null,
        image: eventImage || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZXZlbnR8ZW58MHx8MHx8fDA%3D",
        category: eventCategory || "Other",
        created_by: user.id,
        created_at: new Date().toISOString(),
        featured: false,
      };

      const { error } = await supabase
        .from(TABLES.EVENTS)
        .insert(eventData);

      if (error) throw error;

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!user) {
    return null; // Should not happen if loading is handled, but as a fallback
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-300 via-red-500 to-red-600">
      <Header />
      <div className="absolute top-6 left-6">
        <Link href="/">
          <div className="flex items-center text-gray-900 hover:text-yellow-400 text-sm font-medium gap-2 bg-white bg-opacity-90 px-3 py-2 rounded-lg">
            <FiArrowLeft className="w-5 h-5" />
            Back to Home
          </div>
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg flex flex-col gap-4 border border-gray-200">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">Create Event</h2>
        <div className="text-center text-gray-600 mb-2 text-base">Signed in as <span className="font-semibold text-yellow-600">{user.user_metadata?.full_name || user.email}</span></div>
        <input
          type="text"
          placeholder="Event Name"
          value={eventName}
          onChange={e => setEventName(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          required
        />
        {/* Category Dropdown */}
        <select
          value={eventCategory}
          onChange={e => setEventCategory(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          required
        >
          <option value="" disabled>Select Category</option>
          <option value="Music">Music</option>
          <option value="Art">Art</option>
          <option value="Food">Food</option>
          <option value="Technology">Technology</option>
          <option value="Wellness">Wellness</option>
          <option value="Comedy">Comedy</option>
          <option value="Business">Business</option>
          <option value="Education">Education</option>
          <option value="Community">Community</option>
          <option value="Other">Other</option>
        </select>
        {/* Custom category input removed for strict category linking */}
        {/* Location Dropdown */}
        <select
          value={eventLocation}
          onChange={e => setEventLocation(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          required
        >
          <option value="" disabled>Select Location</option>
          <option value="Port Moresby">Port Moresby</option>
          <option value="Lae">Lae</option>
          <option value="Madang">Madang</option>
          <option value="Goroka">Goroka</option>
          <option value="Mount Hagen">Mount Hagen</option>
          <option value="Other">Other</option>
        </select>
        {eventLocation === "Other" && (
          <input
            type="text"
            placeholder="Enter custom location"
            value={customLocation}
            onChange={e => setCustomLocation(e.target.value)}
            className="rounded-lg px-4 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            required
          />
        )}
        <input
          type="datetime-local"
          value={eventDate}
          onChange={e => setEventDate(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          required
        />
        <input
          type="number"
          placeholder="Price (PGK)"
          value={eventPrice}
          onChange={e => setEventPrice(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          min="0"
          required
        />
        <textarea
          placeholder="Description"
          value={eventDescription}
          onChange={e => setEventDescription(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          rows={3}
          required
        />
        {/* Image upload removed due to plan limitations */}
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button type="submit" disabled={isSubmitting} className="rounded-lg px-6 py-2 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition disabled:opacity-50">
          {isSubmitting ? "Creating..." : "Create Event"}
        </button>
      </form>
    </div>
  );
}
