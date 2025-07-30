
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface UserProfile {
  name?: string;
  email?: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        try {
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().name) {
            setProfile({ name: docSnap.data().name, email: u.email });
          } else {
            setProfile({ name: u.displayName || 'User', email: u.email });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile({ name: u.displayName || 'User', email: u.email }); // Fallback
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
  };

  return { user, profile, loading, handleLogout };
};
