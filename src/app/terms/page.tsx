export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div className="py-16 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
          <p className="text-gray-700 mb-6">Welcome to PNG Events. By using our platform, you agree to the following terms and conditions:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li>All event information is provided by organizers and may be subject to change.</li>
            <li>Users are responsible for verifying event details before attending.</li>
            <li>We do not guarantee the accuracy or availability of any event listed.</li>
            <li>Personal information is handled according to our privacy policy.</li>
            <li>Abusive or fraudulent activity will result in account suspension.</li>
          </ul>
          <p className="text-gray-700">For questions, contact us at <a href="mailto:support@pngevents.com" className="text-blue-600 hover:underline">support@pngevents.com</a>.</p>
        </div>
      </div>
      <footer className="w-full py-8 px-4 sm:px-8 bg-black border-t border-red-600">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
          <div className="flex gap-6 mb-2 md:mb-0">
            <a href="/events" className="hover:text-yellow-300 text-white">Events</a>
            <a href="/categories" className="hover:text-yellow-300 text-white">Categories</a>
            <a href="/about" className="hover:text-yellow-300 text-white">About</a>
          </div>
          <div className="text-center text-white">© 2025 PNG Events. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="/terms" className="hover:text-yellow-300 text-white">Terms</a>
            <a href="/privacy" className="hover:text-yellow-300 text-white">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
