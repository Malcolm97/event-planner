"use client";
import Header from "../../components/Header";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, onSnapshot as onFSnapshot, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";
import UserProfile from "../../components/UserProfile";
import { db } from "../../lib/firebase"; // Import db from firebase

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [success, setSuccess] = useState("");
  const [profileError, setProfileError] = useState<string>("");
  const [editEvent, setEditEvent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/signin");
      } else {
        setUser(user);
        // Only show success if redirected from edit-profile
        if (router && typeof window !== 'undefined' && window.location.search.includes('updated=1')) {
          setSuccess("Profile updated successfully!");
          setTimeout(() => setSuccess(""), 3000);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        // Fetch user's events from Firestore and RTDB
        // Firestore
        const q = query(collection(db, "events"), where("createdBy", "==", user.uid), orderBy("date", "desc"));
        const unsubFS = onFSnapshot(q, (snapshot) => {
          try {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(data);
          } catch (error) {
            console.error("Error fetching user events:", error);
            // Fallback to RTDB
            const rtdb = getDatabase();
            const eventsRef = dbRef(rtdb, "events");
            onValue(eventsRef, (snap) => {
              const val = snap.val();
              if (val) {
                const arr = Object.entries(val)
                  .map(([id, event]) => {
                    if (event && typeof event === 'object' && (event as any).createdBy === user.uid) {
                      return { id, ...(event as any) };
                    }
                    return null;
                  })
                  .filter((e): e is { id: string; date?: string; createdAt?: string | { seconds?: number } } => e !== null);
                
                arr.sort((a, b) => {
                  const aTime = a.date ? Date.parse(a.date) : (typeof a.createdAt === 'string' ? Date.parse(a.createdAt) : (a.createdAt && typeof a.createdAt === 'object' && a.createdAt.seconds ? a.createdAt.seconds * 1000 : 0));
                  const bTime = b.date ? Date.parse(b.date) : (typeof b.createdAt === 'string' ? Date.parse(b.createdAt) : (b.createdAt && typeof b.createdAt === 'object' && b.createdAt.seconds ? b.createdAt.seconds * 1000 : 0));
                  return bTime - aTime;
                });
                
                setEvents(arr);
              } else {
                setEvents([]);
              }
            });
          }
        });
        
        return () => unsubFS();
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleEditClick = (event: any) => {
    setEditEvent(event);
    setEditForm({ ...event });
    setEditError("");
    setEditSuccess("");
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      const eventRef = doc(db, "events", editEvent.id);
      await updateDoc(eventRef, {
        name: editForm.name,
        category: editForm.category,
        location: editForm.location,
        price: Number(editForm.price),
        description: editForm.description,
        date: editForm.date,
      });
      setEditSuccess("Event updated successfully!");
      setTimeout(() => {
        setEditEvent(null);
        setEditSuccess("");
      }, 1200);
    } catch (err: any) {
      setEditError("Failed to update event. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
    setDeleteLoadingId(eventId);
    try {
      await deleteDoc(doc(db, "events", eventId));
    } catch (err) {
      alert("Failed to delete event. Please try again.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0c3fc] via-[#8ec5fc] to-[#f9f9f9] dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="text-lg text-gray-700 dark:text-gray-200">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      {/* Dashboard Hero/Header */}
      <section className="w-full py-12 px-4 sm:px-8 bg-gradient-to-b from-yellow-300 to-red-600 border-b border-black">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">My Dashboard</h1>
          <p className="text-lg text-gray-600 max-w-2xl">Welcome to your PNG Events dashboard. Manage your account and events here.</p>
        </div>
      </section>
      <div className="max-w-5xl mx-auto flex flex-col gap-8 p-4 sm:p-8">
        {success && <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4 text-center">{success}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* User Profile and Actions (Left) */}
          <div className="col-span-1 rounded-3xl border border-gray-200 bg-white/70 backdrop-blur-lg shadow-2xl flex flex-col overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-red-400" />
            <div className="p-8 flex flex-col gap-6 items-center">
              <UserProfile userId={user.uid} onError={setProfileError} />
              {profileError && (
                <div className="text-red-500 text-sm text-center mb-2">{profileError}</div>
              )}
              <div className="flex flex-col gap-2 w-full mt-2">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2 bg-white border border-black text-red-600 font-semibold hover:bg-yellow-300 hover:text-black transition shadow w-full"
                  onClick={() => router.push('/dashboard/edit-profile')}
                  disabled={!!profileError}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" /></svg>
                  Edit Profile
                </button>
                <button
                  onClick={async () => { await signOut(auth); router.replace("/signin"); }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition shadow w-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
          {/* My Events Card (Right) */}
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200 col-span-2 flex flex-col overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-red-400" />
            <div className="p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">My Events</h2>
                <button
                  onClick={() => router.push("/create-event")}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition shadow"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Create Event
                </button>
              </div>
              {events.length === 0 ? (
                <div className="text-gray-600 text-center">You haven't created any events yet.</div>
              ) : (
                <>
                  {/* Upcoming Events Section */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Upcoming Events</h3>
                    <ul className="divide-y divide-gray-100">
                      {events.filter(ev => {
                        const now = new Date();
                        const eventDate = ev.date ? new Date(ev.date) : null;
                        return eventDate && eventDate >= now;
                      }).map(ev => (
                        <li key={ev.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between group gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                            <span className="font-medium text-gray-900 group-hover:text-yellow-600 transition">{ev.name}</span>
                            <span className="text-xs text-gray-500 ml-2">{ev.date ? new Date(ev.date).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="inline-flex items-center gap-2 rounded-lg px-4 py-1.5 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition shadow text-sm"
                              onClick={() => handleEditClick(ev)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" /></svg>
                              Edit
                            </button>
                            <button
                              className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 bg-red-500 text-white font-semibold hover:bg-red-600 transition shadow text-sm ${deleteLoadingId === ev.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                              onClick={() => handleDelete(ev.id)}
                              disabled={deleteLoadingId === ev.id}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              {deleteLoadingId === ev.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Past Events Section */}
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Past Events</h3>
                    <ul className="divide-y divide-gray-100">
                      {events.filter(ev => {
                        const now = new Date();
                        const eventDate = ev.date ? new Date(ev.date) : null;
                        return eventDate && eventDate < now;
                      }).map(ev => (
                        <li key={ev.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between group gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                            <span className="font-medium text-gray-900 group-hover:text-yellow-600 transition">{ev.name}</span>
                            <span className="text-xs text-gray-500 ml-2">{ev.date ? new Date(ev.date).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="inline-flex items-center gap-2 rounded-lg px-4 py-1.5 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition shadow text-sm"
                              onClick={() => handleEditClick(ev)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" /></svg>
                              Edit
                            </button>
                            <button
                              className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 bg-red-500 text-white font-semibold hover:bg-red-600 transition shadow text-sm ${deleteLoadingId === ev.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                              onClick={() => handleDelete(ev.id)}
                              disabled={deleteLoadingId === ev.id}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              {deleteLoadingId === ev.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Edit Event Modal */}
      {editEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fade-in">
            <button onClick={() => setEditEvent(null)} className="absolute top-3 right-3 text-gray-500 hover:text-black text-2xl font-bold">&times;</button>
            <h2 className="text-2xl font-extrabold mb-4 text-gray-900">Edit Event</h2>
            <form onSubmit={handleEditSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-800">Name</label>
                <input type="text" name="name" value={editForm.name || ""} onChange={handleEditChange} className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-800">Category</label>
                <input type="text" name="category" value={editForm.category || ""} onChange={handleEditChange} className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-800">Location</label>
                <input type="text" name="location" value={editForm.location || ""} onChange={handleEditChange} className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-800">Price (PGK)</label>
                <input type="number" name="price" value={editForm.price || 0} onChange={handleEditChange} className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" step="0.01" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-800">Date</label>
                <input type="datetime-local" name="date" value={editForm.date ? editForm.date.slice(0, 16) : ""} onChange={handleEditChange} className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-800">Description</label>
                <textarea name="description" value={editForm.description || ""} onChange={handleEditChange} className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3} required />
              </div>
              {editError && <div className="text-red-500 text-sm">{editError}</div>}
              {editSuccess && <div className="text-green-600 text-sm">{editSuccess}</div>}
              <button type="submit" className="rounded-lg px-6 py-2 bg-yellow-500 text-black font-semibold hover:bg-yellow-600 transition shadow mt-2 disabled:opacity-60" disabled={editLoading}>{editLoading ? "Saving..." : "Save Changes"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
