import Link from 'next/link';

export default function AppFooter() {
  return (
    <footer className="w-full py-4 sm:py-6 px-4 sm:px-6 lg:px-8 bg-gray-900 border-t border-gray-700 mt-auto">
      <div className="max-w-6xl mx-auto">
        {/* Desktop Footer */}
        <div className="hidden lg:flex lg:flex-col lg:items-center text-gray-400 text-sm space-y-2">
          {/* Copyright */}
          <div className="text-gray-300 font-medium text-sm sm:text-base">
            © 2025 PNG Events. All rights reserved.
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/terms" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-xs sm:text-sm" aria-label="Terms">Terms</Link>
            <Link href="/privacy" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-xs sm:text-sm" aria-label="Privacy">Privacy</Link>
            <Link href="/settings" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-xs sm:text-sm" aria-label="Settings">Settings</Link>
            <Link href="/download" className="hover:text-yellow-400 text-gray-300 transition-colors font-medium text-xs sm:text-sm" aria-label="Download">Download</Link>
          </div>
        </div>

        {/* Mobile/Tablet Footer - Copyright Only */}
        <div className="lg:hidden text-center text-gray-300 font-medium text-sm sm:text-base">
          © 2025 PNG Events. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
