"use client";
import { useState, useEffect } from "react";
import { auth, db, storage } from "../../lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDatabase, ref as dbRef, set as dbSet } from "firebase/database";
import { useRouter } from "next/navigation";

export default function CreateEventPage() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.replace("/signin");
      } else {
        setUser(user);
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
      if (image) {
        const imageRef = ref(storage, `events/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }
      // Use plain JS dates for Firestore
      const eventData = {
        name,
        location,
        date: new Date(date).toISOString(),
        price: parseFloat(price),
        description,
        image: imageUrl,
        createdBy: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      };
      console.log("Creating event:", eventData);
      // Write to Firestore
      await addDoc(collection(db, "events"), eventData);
      // Write to Realtime Database
      const rtdb = getDatabase();
      const newEventRef = dbRef(rtdb, `events/${Date.now()}`);
      await dbSet(newEventRef, eventData);
      setLoading(false);
      setError("");
      // Show confirmation and redirect after short delay
      alert("Event created successfully!");
      router.push("/");
      return;
    } catch (err: any) {
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
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 w-full max-w-lg flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">Create Event</h2>
        <div className="text-center text-gray-600 dark:text-gray-300 mb-2 text-base">Signed in as <span className="font-semibold text-indigo-600">{user.displayName || user.email}</span></div>
        <input
          type="text"
          placeholder="Event Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
        <input
          type="datetime-local"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
        <input
          type="number"
          placeholder="Price (USD)"
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
        <input
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files?.[0] || null)}
          className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button type="submit" disabled={loading} className="rounded-lg px-6 py-2 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
          {loading ? "Creating..." : "Create Event"}
        </button>
      </form>
    </div>
  );
}
