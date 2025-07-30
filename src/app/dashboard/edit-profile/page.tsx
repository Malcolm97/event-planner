"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDatabase, ref as dbRef, set as dbSet } from "firebase/database";
import UserProfile from "../../../components/UserProfile";

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    name: "",
    phone: "",
    company: "",
    about: ""
  });
  // Image upload removed due to plan limitations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/signin");
      } else {
        setUser(user);
        // Fetch profile from Firestore (if exists)
        const docRef = doc(db, "users", user.uid);
        
        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile({
              name: data.name || user.displayName || "",
              phone: data.phone || "",
              company: data.company || "",
              about: data.about || data.description || "",
              photoURL: data.photoURL || user.photoURL || ""
            });
          } else {
            // Set default values from Firebase Auth
            setProfile({
              name: user.displayName || "",
              phone: "",
              company: "",
              about: "",
              photoURL: user.photoURL || ""
            });
          }
        });
        
        return () => unsubscribe();
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [router]);

  // Test Firestore connection on mount (fetch and log profile)
  useEffect(() => {
    if (user && user.uid) {
      const testFetch = async () => {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.log("[TEST] Profile fetched from Firestore:", docSnap.data());
          } else {
            console.log("[TEST] No profile found in Firestore for this user.");
          }
        } catch (err) {
          console.error("[TEST] Error fetching profile from Firestore:", err);
        }
      };
      testFetch();
    }
  }, [user]);

  // Add onSnapshot listener for real-time updates
  useEffect(() => {
    if (user && user.uid) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          console.log("Profile updated: ", docSnap.data());
        }
      });
      return () => unsub();
    }
  }, [user]);

  // Add confirmation dialog for delete
  const handleDeleteProfile = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete your profile? This action cannot be undone.")) {
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await deleteDoc(doc(db, "users", user.uid));
      setSuccess("Profile deleted successfully!");
      setTimeout(() => {
        router.replace("/signin");
      }, 1000);
    } catch (err: any) {
      setError("Failed to delete profile. Please try again.");
      console.error("Profile delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add confirmation dialog for save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Save changes to your profile?")) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Image upload removed due to plan limitations
      let profileData = {
        name: profile.name || "",
        company: profile.company || "",
        phone: profile.phone || "",
        about: profile.about || "",
        email: user.email,
        updatedAt: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, "users", user.uid), profileData, { merge: true });
      } catch (err: any) {
        if (err.message && err.message.includes("offline")) {
          setError("You appear to be offline. Please check your connection and try again.");
        } else {
          setError("Failed to save changes. Please try again.");
        }
        setLoading(false);
        return;
      }
      // Write to Realtime Database as well, using email as key
      const rtdb = getDatabase();
      const emailKey = user.email.replace(/\./g, ',');
      await dbSet(dbRef(rtdb, `usersByEmail/${emailKey}`), profileData);
      setSuccess("Profile updated successfully!");
      // Show success for 2 seconds, then redirect
      setTimeout(() => {
        setSuccess("");
        router.replace("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError("Failed to save changes. Please try again.");
      setUploading(false);
      console.error("Profile update error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0c3fc] via-[#8ec5fc] to-[#f9f9f9] dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="absolute top-6 left-6">
        <a href="/dashboard" className="flex items-center text-gray-600 hover:text-indigo-600 text-sm font-medium gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Dashboard
        </a>
      </div>
      <div className="flex flex-col gap-8 w-full max-w-md">
        <UserProfile userId={user?.uid} />
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 flex flex-col gap-4 mt-4">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">Edit Profile</h2>
          <div className="flex flex-col items-center gap-2">
            {/* Profile image upload removed due to plan limitations */}
            <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden">
              {profile.name[0] || "U"}
            </div>
          </div>
          <input
            type="text"
            placeholder="Name"
            value={profile.name}
            onChange={e => setProfile({ ...profile, name: e.target.value })}
            className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <input
            type="text"
            placeholder="Company"
            value={profile.company}
            onChange={e => setProfile({ ...profile, company: e.target.value })}
            className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={profile.phone}
            onChange={e => setProfile({ ...profile, phone: e.target.value })}
            className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <textarea
            placeholder="About"
            value={profile.about}
            onChange={e => setProfile({ ...profile, about: e.target.value })}
            className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            rows={3}
          />
          {uploading && (
            <div className="flex items-center justify-center gap-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded mb-2 text-sm font-medium">
              <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              Uploading photo...
            </div>
          )}
          {success && (
            <div className="flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded mb-2 text-sm font-semibold shadow">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              {success}
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-2 rounded mb-2 text-sm font-semibold shadow">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="rounded-lg px-6 py-2 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={handleDeleteProfile} disabled={loading} className="rounded-lg px-6 py-2 bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50 mt-2">
            Delete Profile
          </button>
        </form>
      </div>
    </div>
  );
}
