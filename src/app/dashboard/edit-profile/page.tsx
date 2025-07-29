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
    about: "",
    photoURL: ""
  });
  const [photo, setPhoto] = useState<File | null>(null);
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
      let photoURL = profile.photoURL;
      // Only send allowed fields to Firestore and RTDB
      const profileData = {
        name: profile.name || "",
        company: profile.company || "",
        phone: profile.phone || "",
        about: profile.about || "",
        photoURL: photoURL || "",
        email: user.email,
        updatedAt: new Date().toISOString(),
      };
      if (photo) {
        setUploading(true);
        try {
          await updateDoc(doc(db, "users", user.uid), {
            ...profileData,
            photoURL: "",
          });
          const photoRef = ref(storage, `users/${user.uid}/profile.jpg`);
          await uploadBytes(photoRef, photo);
          photoURL = await getDownloadURL(photoRef);
          await updateDoc(doc(db, "users", user.uid), {
            photoURL,
            updatedAt: new Date().toISOString(),
          });
        } catch (err: any) {
          if (err.message && err.message.includes("offline")) {
            setError("You appear to be offline. Please check your connection and try again.");
          } else {
            setError("Failed to save changes. Please try again.");
          }
          setUploading(false);
          setLoading(false);
          return;
        }
        setUploading(false);
      } else {
        try {
          await updateDoc(doc(db, "users", user.uid), profileData);
        } catch (err: any) {
          if (err.message && err.message.includes("offline")) {
            setError("You appear to be offline. Please check your connection and try again.");
          } else {
            setError("Failed to save changes. Please try again.");
          }
          setLoading(false);
          return;
        }
      }
      // Write to Realtime Database as well, using email as key
      const rtdb = getDatabase();
      const emailKey = user.email.replace(/\./g, ',');
      await dbSet(dbRef(rtdb, `usersByEmail/${emailKey}`), profileData);
      setSuccess("Profile updated successfully!");
      router.replace("/dashboard");
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
      <div className="flex flex-col gap-8 w-full max-w-md">
        <UserProfile userId={user?.uid} />
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 flex flex-col gap-4 mt-4">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">Edit Profile</h2>
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profile.name[0] || "U"
              )}
            </div>
            <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} />
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
          {uploading && <div className="text-indigo-500 text-sm text-center">Uploading photo...</div>}
          {success && <div className="text-green-500 text-sm text-center">{success}</div>}
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
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
