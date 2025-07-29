"use client";
import { useState, useEffect } from "react";
import { auth } from "../../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { db, storage } from "../../lib/firebase";
import { setDoc, doc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { getDatabase, ref as dbRef, set as dbSet, onValue } from "firebase/database";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (auth.currentUser) {
      // Firestore real-time listener
      const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          console.log("Firestore profile updated: ", docSnap.data());
        }
      });
      // Realtime Database real-time listener
      const rtdb = getDatabase();
      const userRef = dbRef(rtdb, `users/${auth.currentUser.uid}`);
      const rtdbUnsub = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          console.log("Realtime DB profile updated: ", snapshot.val());
        }
      });
      return () => {
        unsub();
        rtdbUnsub();
      };
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        let photoURL = "";
        if (photo) {
          const photoRef = ref(storage, `users/${userCred.user.uid}/profile.jpg`);
          await uploadBytes(photoRef, photo);
          photoURL = await getDownloadURL(photoRef);
        }
        // Update Firebase Auth profile with displayName and photoURL
        await updateProfile(userCred.user, {
          displayName: name || "",
          photoURL: photoURL || undefined,
        });
        // Prepare user profile data
        const userProfile = {
          name: name || "",
          company: company || "",
          phone: phone || "",
          about: about || "",
          photoURL,
          email,
          updatedAt: new Date().toISOString(),
        };
        // Write to Firestore
        await setDoc(doc(db, "users", userCred.user.uid), userProfile, { merge: true });
        // Write to Realtime Database by UID
        const rtdb = getDatabase();
        await dbSet(dbRef(rtdb, `users/${userCred.user.uid}`), userProfile);
        // Write to Realtime Database by email (replace dots for valid key)
        const emailKey = email.replace(/\./g, ',');
        await dbSet(dbRef(rtdb, `usersByEmail/${emailKey}`), userProfile);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace("/dashboard");
    } catch (err: any) {
      if (err.message && err.message.includes("offline")) {
        setError("You appear to be offline. Please check your connection and try again.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0c3fc] via-[#8ec5fc] to-[#f9f9f9] dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center text-gray-600 hover:text-indigo-600 text-sm font-medium gap-2">
          <FiArrowLeft className="text-lg" />
          Back to Events
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-center mb-1 text-gray-900 dark:text-white tracking-tight">
          Welcome to EventHub
        </h2>
        <p className="text-center text-gray-500 text-base mb-2">Sign in to discover and create amazing events</p>
        {/* Tabs */}
        <div className="flex mb-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
          <button
            type="button"
            className={`flex-1 py-2 text-lg font-semibold transition-colors duration-150 ${!isRegister ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white" : "text-gray-400"}`}
            onClick={() => setIsRegister(false)}
            tabIndex={0}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-lg font-semibold transition-colors duration-150 ${isRegister ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white" : "text-gray-400"}`}
            onClick={() => setIsRegister(true)}
            tabIndex={0}
          >
            Register
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {isRegister ? (
            <>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="rounded-lg px-4 py-2 border border-gray-200 bg-gray-50 focus:bg-white dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="rounded-lg px-4 py-2 border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="rounded-lg px-4 py-2 border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="rounded-lg px-4 py-2 border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </>
          ) : (
            <>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="rounded-lg px-4 py-2 border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
              <input
                type="password"
                placeholder={isRegister ? "Create a password" : "Enter your password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="rounded-lg px-4 py-2 border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </>
          )}
        </div>
        {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg px-6 py-3 bg-[#7b2ff2] text-white font-semibold text-lg shadow-md hover:bg-[#5f1be0] transition disabled:opacity-50 mt-2"
        >
          {loading ? "Loading..." : isRegister ? "Create Account" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
