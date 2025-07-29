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
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const handleError = useCallback((message: string) => {
    setError(message);
    if (onError) {
      onError(message);
    }
  }, [onError]);

  useEffect(() => {
    if (!userId && !email) {
      handleError("No user ID or email provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    let unsubscribe: (() => void) | null = null;

    if (userId) {
      // Try Firestore first
      const userRef = doc(db, "users", userId);
      unsubscribe = onSnapshot(
        userRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setUserData(data);
            setLoading(false);
            handleError("");
          } else {
            // If not found in Firestore, try Realtime Database
            const rtdb = getDatabase();
            const rtdbRef = dbRef(rtdb, `users/${userId}`);
            
            onValue(rtdbRef, (snapshot) => {
              if (snapshot.exists()) {
                setUserData(snapshot.val());
                setLoading(false);
                handleError("");
              } else {
                setUserData(null);
                setLoading(false);
                handleError("User profile not found.");
              }
            }, (err) => {
              console.error("RTDB error:", err);
              handleError("Failed to load user profile.");
              setLoading(false);
            });
          }
        },
        (err) => {
          console.error("Firestore error:", err);
          handleError("Failed to load user profile.");
          setLoading(false);
        }
      );
    } else if (email) {
      // Try Realtime Database with email key
      const rtdb = getDatabase();
      const emailKey = email.replace(/\./g, ",");
      const rtdbRef = dbRef(rtdb, `usersByEmail/${emailKey}`);
      
      onValue(rtdbRef, (snapshot) => {
        if (snapshot.exists()) {
          setUserData(snapshot.val());
          setLoading(false);
          handleError("");
        } else {
          setUserData(null);
          setLoading(false);
          handleError("User profile not found.");
        }
      }, (err) => {
        console.error("RTDB error:", err);
        handleError("Failed to load user profile.");
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId, email, handleError]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col items-center gap-2">
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col items-center gap-2">
        <div className="text-red-500 text-sm text-center">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col items-center gap-2">
        <div className="text-gray-500 text-sm text-center">
          <p>No profile data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 flex flex-col items-center gap-3">
      <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
        User Profile
      </h2>
      
      {/* Profile Photo */}
      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
        {userData.photoURL ? (
          <img
            src={userData.photoURL}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`text-2xl font-bold text-gray-500 ${userData.photoURL ? 'hidden' : ''}`}>
          {userData.name ? userData.name.charAt(0).toUpperCase() : '?'}
        </div>
      </div>

      {/* Profile Information */}
      <div className="text-center space-y-2">
        {userData.name && (
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {userData.name}
          </p>
        )}
        
        {userData.email && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {userData.email}
          </p>
        )}
        
        {userData.company && (
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
            {userData.company}
          </p>
        )}
        
        {userData.phone && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            📞 {userData.phone}
          </p>
        )}
        
        {(userData.about || userData.description) && (
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
            {userData.about || userData.description}
          </p>
        )}
      </div>
    </div>
  );
}