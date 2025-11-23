import Link from 'next/link';

export default function AppFooter() {
  return (
    <footer className="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 border-t border-gray-700 mt-auto">
      <div className="max-w-6xl mx-auto">
        {/* Desktop Footer */}
        <div className="hidden lg:flex lg:flex-col lg:items-center text-gray-400 text-sm space-y-4">
          {/* Community Message */}
          <div className="text-center max-w-2xl">
            <p className="text-gray-300 text-sm leading-relaxed">
              PNG Events - Bringing Papua New Guinea communities together through memorable experiences.
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/terms" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-xs sm:text-sm" aria-label="Terms">Terms</Link>
            <Link href="/privacy" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-xs sm:text-sm" aria-label="Privacy">Privacy</Link>
            <Link href="/about" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-xs sm:text-sm" aria-label="About">About</Link>
            <Link href="/settings" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-xs sm:text-sm" aria-label="Settings">Settings</Link>
            <Link href="/download" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-xs sm:text-sm" aria-label="Download">Download</Link>
          </div>

          {/* Contact Info */}
          <div className="text-center text-gray-500 text-xs space-y-1">
            <p>📍 Papua New Guinea</p>
          </div>

          {/* Copyright */}
          <div className="text-gray-300 font-medium text-sm">
            © 2025 PNG Events. All rights reserved.
          </div>
        </div>

        {/* Mobile/Tablet Footer */}
        <div className="lg:hidden text-center space-y-3">
          <div className="text-gray-300 text-sm leading-relaxed">
            Bringing PNG communities together! 🎉
          </div>
          <div className="flex justify-center gap-4 text-xs">
            <Link href="/terms" className="hover:text-yellow-400 text-gray-400 transition-colors" aria-label="Terms">Terms</Link>
            <Link href="/privacy" className="hover:text-yellow-400 text-gray-400 transition-colors" aria-label="Privacy">Privacy</Link>
            <Link href="/about" className="hover:text-yellow-400 text-gray-400 transition-colors" aria-label="About">About</Link>
          </div>
          <div className="text-gray-300 font-medium text-sm">
            © 2025 PNG Events. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
