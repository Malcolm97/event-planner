import Link from "next/link";
import { FiSearch, FiUser } from "react-icons/fi";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-8 h-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">PNG Events</Link>
          <nav className="hidden md:flex gap-6 text-gray-700 dark:text-gray-300 font-medium">
            <Link href="#" className="hover:text-indigo-600">Events</Link>
            <Link href="#" className="hover:text-indigo-600">Categories</Link>
            <Link href="#" className="hover:text-indigo-600">About</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-300">
            <FiSearch size={20} />
          </button>
          <Link href="/signin" className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <FiUser size={18} />
            <span>Sign In</span>
          </Link>
          <Link href="/create-event" className="ml-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow">
            Create Event
          </Link>
        </div>
      </div>
    </header>
  );
}
