import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";
import { db } from "../lib/firebase";

interface UserProfileProps {
  userId?: string;
  email?: string;
  onError?: (msg: string) => void;
}

export default function UserProfile({ userId, email, onError }: UserProfileProps) {
  const stableOnError = onError ?? (() => {});
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    let unsubFirestore: (() => void) | null = null;
    let unsubRTDB: (() => void) | null = null;
    let didSet = false;
    if (!userId && !email) {
      setLoading(false);
      stableOnError("No user ID or email provided.");
      return;
    }
    // Firestore fetch
    if (userId) {
      const userRef = doc(db, "users", userId);
      unsubFirestore = onSnapshot(
        userRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            setUserData(docSnapshot.data());
            setLoading(false);
            stableOnError("");
            didSet = true;
          } else if (email) {
            // If no Firestore data, try RTDB by email
            const rtdb = getDatabase();
            const emailKey = email.replace(/\./g, ",");
            const rtdbRef = dbRef(rtdb, `usersByEmail/${emailKey}`);
            unsubRTDB = onValue(
              rtdbRef,
              (snapshot) => {
                if (didSet) return;
                if (snapshot.exists()) {
                  setUserData(snapshot.val());
                  stableOnError("");
                  setLoading(false);
                  didSet = true;
                } else {
                  setUserData(null);
                  stableOnError("User not found in Firestore or RTDB.");
                  setLoading(false);
                }
              },
              (err) => {
                setError(err);
                setLoading(false);
                stableOnError("Failed to load user data.");
              }
            );
          } else {
            // If no Firestore data, try RTDB by UID
            const rtdb = getDatabase();
            const rtdbRef = dbRef(rtdb, `users/${userId}`);
            unsubRTDB = onValue(
              rtdbRef,
              (snapshot) => {
                if (didSet) return;
                if (snapshot.exists()) {
                  setUserData(snapshot.val());
                  stableOnError("");
                  setLoading(false);
                  didSet = true;
                } else {
                  setUserData(null);
                  stableOnError("User not found in Firestore or RTDB.");
                  setLoading(false);
                }
              },
              (err) => {
                setError(err);
                setLoading(false);
                stableOnError("Failed to load user data.");
              }
            );
          }
        },
        (err) => {
          setError(err);
          setLoading(false);
          stableOnError("Failed to load user data.");
        }
      );
      // RTDB fetch in parallel (only set if Firestore hasn't set)
      const rtdb = getDatabase();
      const rtdbRef = dbRef(rtdb, `users/${userId}`);
      unsubRTDB = onValue(
        rtdbRef,
        (snapshot) => {
          if (didSet) return;
          if (snapshot.exists()) {
            setUserData(snapshot.val());
            stableOnError("");
            setLoading(false);
            didSet = true;
          } else {
            setUserData(null);
            stableOnError("User not found in Firestore or RTDB.");
            setLoading(false);
          }
        },
        (err) => {
          setError(err);
          setLoading(false);
          stableOnError("Failed to load user data.");
        }
      );
    } else if (email) {
      // Only email provided
      const rtdb = getDatabase();
      const emailKey = email.replace(/\./g, ",");
      const rtdbRef = dbRef(rtdb, `usersByEmail/${emailKey}`);
      unsubRTDB = onValue(
        rtdbRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setUserData(snapshot.val());
            stableOnError("");
            setLoading(false);
          } else {
            setUserData(null);
            stableOnError("User not found in Firestore or RTDB.");
            setLoading(false);
          }
        },
        (err) => {
          setError(err);
          setLoading(false);
          stableOnError("Failed to load user data.");
        }
      );
    }
    return () => {
      if (unsubFirestore) unsubFirestore();
      if (unsubRTDB) unsubRTDB();
    };
  }, [userId, email, stableOnError, retryCount]);

  if (loading && !userData) return <p>Loading user data...</p>;
  if (error) return <p className="text-red-500 text-sm text-center">Error: {error.message}</p>;
  if (!userData) return (
    <div className="text-red-500 text-sm text-center flex flex-col items-center gap-2">
      Unable to load user data. Please try again later.<br />
      <button
        onClick={handleRetry}
        className="mt-2 px-4 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col items-center gap-2">
      <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
        User Profile
      </h2>
      {userData.photoURL && (
        <img
          src={userData.photoURL}
          alt="Profile"
          className="w-20 h-20 rounded-full object-cover mb-2"
        />
      )}
      <p className="text-gray-800 dark:text-gray-200 font-semibold">
        Name: {userData.name}
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        Email: {userData.email}
      </p>
      {userData.company && (
        <p className="text-gray-600 dark:text-gray-400">
          Company: {userData.company}
        </p>
      )}
      {userData.phone && (
        <p className="text-gray-600 dark:text-gray-400">Phone: {userData.phone}</p>
      )}
      {userData.about && (
        <p className="text-gray-600 dark:text-gray-400">About: {userData.about}</p>
      )}
    </div>
  );
}
