import Link from "next/link";
import { FiSearch, FiUser, FiLogOut, FiUser as FiUserCircle } from "react-icons/fi";
import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState<string>("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Try to get the user's name from Firestore
        const docRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().name) {
          setProfileName(docSnap.data().name);
        } else {
          setProfileName(u.displayName || "");
        }
      } else {
        setProfileName("");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-8 h-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-extrabold text-xl text-gray-900 tracking-tight">PNG Events</Link>
          <nav className="hidden md:flex gap-6 text-gray-700 font-medium">
            <Link href="#" className="hover:text-indigo-600">Events</Link>
            <Link href="#" className="hover:text-indigo-600">Categories</Link>
            <Link href="#" className="hover:text-indigo-600">About</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <FiSearch size={20} />
          </button>
          {user ? (
            <div className="flex items-center gap-2 text-gray-600 font-medium">
              <span>Welcome, {profileName || user.email}</span>
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full text-gray-500" title="Dashboard">
                <FiUserCircle size={20} />
              </Link>
              <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full text-gray-500" title="Logout">
                <FiLogOut size={20} />
              </button>
            </div>
          ) : (
            <Link href="/signin" className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-100 transition">
              <FiUser size={18} />
              <span>Sign In</span>
            </Link>
          )}
          <Link href="/create-event" className="ml-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow">
            Create Event
          </Link>
        </div>
      </div>
    </header>
  );
}
