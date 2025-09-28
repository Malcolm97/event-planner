import Link from 'next/link';

export default function AppFooter() {
  return (
    <footer className="w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 border-t border-gray-700 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-400 text-sm items-center">
          {/* Navigation Links */}
          <div className="flex items-center justify-center md:justify-start gap-4 sm:gap-6">
            <Link href="/events" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-sm sm:text-base px-2 py-1" aria-label="Events">Events</Link>
            <Link href="/categories" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-sm sm:text-base px-2 py-1" aria-label="Categories">Categories</Link>
            <Link href="/about" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-sm sm:text-base px-2 py-1" aria-label="About">About</Link>
          </div>

          {/* Copyright */}
          <div className="text-center text-gray-300 font-medium text-sm sm:text-base">
            © 2025 PNG Events. All rights reserved.
          </div>

          {/* Legal Links */}
          <div className="flex items-center justify-center md:justify-end gap-4 sm:gap-6">
            <Link href="/terms" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-sm sm:text-base" aria-label="Terms">Terms</Link>
            <Link href="/privacy" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-sm sm:text-base" aria-label="Privacy">Privacy</Link>
            <Link href="/download" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-sm sm:text-base" aria-label="Download">Download</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
