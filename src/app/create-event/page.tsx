"use client";
import { useState, useEffect } from "react";
import { auth, db, storage } from "../../lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDatabase, ref as dbRef, set as dbSet } from "firebase/database";
import { useRouter } from "next/navigation";

export default function CreateEventPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [date, setDate] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.replace("/signin");
      } else {
        setUser(user);
        // Try to get the user's name from Firestore
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("../../lib/firebase");
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().name) {
            setUserName(userDoc.data().name);
          } else {
            setUserName("");
          }
        } catch {
          setUserName("");
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!auth.currentUser) {
      setError("You must be signed in to create an event.");
      setLoading(false);
      return;
    }
    try {
      let imageUrl = "";
      // Image upload removed due to plan limitations
      // Use plain JS dates for Firestore
      const eventData = {
        name,
        category: category,
        location: location === "Other" ? customLocation : location,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        price: parseFloat(price),
        description,
        image: "",
        createdBy: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      };
      console.log("Creating event:", eventData);
      // Write to Firestore
      const docRef = await addDoc(collection(db, "events"), eventData);
      // Write to Realtime Database
      const rtdb = getDatabase();
      const newEventRef = dbRef(rtdb, `events/${docRef.id}`);
      await dbSet(newEventRef, eventData);
      setError("");
      alert("Event created successfully!");
      setLoading(false);
      router.push("/dashboard");
      return;
    } catch (err: any) {
      console.error("Error creating event:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    // Optionally show a loading spinner or nothing while checking auth
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0c3fc] via-[#8ec5fc] to-[#f9f9f9] dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="absolute top-6 left-6">
        <a href="/" className="flex items-center text-gray-600 hover:text-indigo-600 text-sm font-medium gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Home
        </a>
      </div>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 w-full max-w-lg flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">Create Event</h2>
        <div className="text-center text-gray-600 dark:text-gray-300 mb-2 text-base">Signed in as <span className="font-semibold text-indigo-600">{userName || user.displayName || user.email}</span></div>
        <input
          type="text"
          placeholder="Event Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
        {/* Category Dropdown */}
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
        </select>
        {/* Custom category input removed for strict category linking */}
        {/* Location Dropdown */}
        <select
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
        {location === "Other" && (
          <input
            type="text"
            placeholder="Enter custom location"
            value={customLocation}
            onChange={e => setCustomLocation(e.target.value)}
            className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
        )}
        <input
          type="datetime-local"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
        <input
          type="number"
          placeholder="Price (PGK)"
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          min="0"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          rows={3}
          required
        />
        {/* Image upload removed due to plan limitations */}
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button type="submit" disabled={loading} className="rounded-lg px-6 py-2 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
          {loading ? "Creating..." : "Create Event"}
        </button>
      </form>
    </div>
  );
}
