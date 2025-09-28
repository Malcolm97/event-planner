import Link from 'next/link';

export default function AppFooter() {
  return (
    <footer className="w-full py-12 px-4 sm:px-8 bg-gray-900 border-t border-gray-700 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-gray-400 text-sm">
        <div className="flex gap-6 mb-2 md:mb-0">
          <Link href="/events" className="whitespace-nowrap min-w-[90px] px-3 py-2 hover:text-yellow-400 text-gray-300 transition-colors font-medium text-base sm:text-sm" aria-label="Events">Events</Link>
          <Link href="/categories" className="whitespace-nowrap min-w-[110px] px-3 py-2 hover:text-yellow-400 text-gray-300 transition-colors font-medium text-base sm:text-sm" aria-label="Categories">Categories</Link>
          <Link href="/about" className="whitespace-nowrap min-w-[80px] px-3 py-2 hover:text-yellow-400 text-gray-300 transition-colors font-medium text-base sm:text-sm" aria-label="About">About</Link>
        </div>
        <div className="text-center text-gray-300 font-medium">© 2025 PNG Events. All rights reserved.</div>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium" aria-label="Terms">Terms</Link>
          <Link href="/privacy" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium" aria-label="Privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
