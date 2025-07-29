"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, onSnapshot as onFSnapshot, orderBy } from "firebase/firestore";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";
import UserProfile from "../../components/UserProfile";
import { db } from "../../lib/firebase"; // Import db from firebase

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [success, setSuccess] = useState("");
  const [profileError, setProfileError] = useState<string>("");

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
        const q = query(collection(db, "events"), where("createdBy", "==", user.uid), orderBy("date", "asc"));
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
                  return aTime - bTime;
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0c3fc] via-[#8ec5fc] to-[#f9f9f9] dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="text-lg text-gray-700 dark:text-gray-200">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0c3fc] via-[#8ec5fc] to-[#f9f9f9] dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <header className="mb-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">My Dashboard</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">Welcome to your PNG Events dashboard. Manage your account and events here.</p>
        </header>
        {success && <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4 text-center">{success}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="col-span-1">
            <UserProfile userId={user.uid} onError={setProfileError} />
            {profileError && (
              <div className="text-red-500 text-sm text-center mb-2">{profileError}</div>
            )}
            <button
              className="rounded-lg px-6 py-2 bg-indigo-50 dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-100 dark:hover:bg-gray-700 transition mt-2 w-full"
              onClick={() => router.push('/dashboard/edit-profile')}
              disabled={!!profileError}
            >
              Edit Profile
            </button>
            <button
              onClick={async () => { await signOut(auth); router.replace("/signin"); }}
              className="rounded-lg px-6 py-2 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition mt-2 w-full"
            >
              Sign Out
            </button>
          </div>
          {/* My Events Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 flex flex-col gap-4 border border-gray-100 dark:border-gray-800 col-span-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">My Events</h2>
            {events.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-400">You haven't created any events yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {events.map(ev => (
                  <li key={ev.id} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">{ev.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{ev.status === "upcoming" ? "Upcoming" : "Past"} • {ev.date}</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => router.push("/create-event")}
              className="rounded-lg px-6 py-2 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition mt-2 self-start"
            >
              + Create Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
