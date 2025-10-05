import AppFooter from '@/components/AppFooter';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div className="py-16 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Install PNG Events</h1>
          <p className="text-gray-700 mb-6">Get PNG Events on your phone! Install our app directly to your home screen for instant access to events - no app store required.</p>

          {/* Install Prompt Section */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-6 mb-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Install Now - It's Free!</h2>
            <p className="text-yellow-900 mb-6">Tap the button below to add PNG Events to your home screen. It works just like a regular app but updates automatically.</p>
            <PWAInstallPrompt />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">iPhone & iPad (iOS)</h2>
            <ol className="list-decimal pl-6 text-gray-700 mb-4">
              <li className="mb-2">Open Safari browser and navigate to our website</li>
              <li className="mb-2">Tap the Share button (square with arrow pointing up)</li>
              <li className="mb-2">Scroll down and tap "Add to Home Screen"</li>
              <li className="mb-2">Tap "Add" to confirm</li>
              <li className="mb-2">Find the PNG Events icon on your home screen!</li>
            </ol>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Android Phones</h2>
            <ol className="list-decimal pl-6 text-gray-700 mb-4">
              <li className="mb-2">Open Chrome browser and navigate to our website</li>
              <li className="mb-2">Tap the menu button (three dots) in the top right</li>
              <li className="mb-2">Tap "Add to Home screen" or "Install app"</li>
              <li className="mb-2">Tap "Add" or "Install" to confirm</li>
              <li className="mb-2">Find the PNG Events icon on your home screen or in your app drawer!</li>
            </ol>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Why Install to Home Screen?</h3>
            <ul className="list-disc pl-6 text-blue-800">
              <li>Quick access to events without opening a browser</li>
              <li>Offline access to saved events</li>
              <li>Push notifications for event updates</li>
              <li>Faster loading times</li>
              <li>Native app-like experience</li>
              <li>No app store download required</li>
              <li>Automatic updates when we improve the app</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Save to Home Screen - Not a Download</h3>
            <div className="text-green-800">
              <p className="mb-3"><strong>Home Screen Installation:</strong> Unlike downloading from app stores, this adds a shortcut to your home screen that opens our website in app mode.</p>
              <p className="mb-3"><strong>Like a Native App:</strong> Once saved to your home screen, PNG Events works just like any other app on your phone. Tap the icon to launch it instantly.</p>
              <p className="mb-3"><strong>Full Functionality:</strong> Access all features including event browsing, user profiles, creating events, and your dashboard - everything works exactly the same as the website.</p>
              <p className="mb-3"><strong>Offline Capability:</strong> View events you've previously loaded even without internet connection. New events require online access.</p>
              <p className="mb-3"><strong>Updates Automatically:</strong> The app updates itself when we release new features - no need to manually update from an app store.</p>
              <p className="mb-3"><strong>Storage Efficient:</strong> Takes up minimal space on your phone compared to native apps.</p>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Important Notes</h3>
            <ul className="list-disc pl-6 text-yellow-800">
              <li>This is a web app that runs in your browser - it doesn't need to be downloaded from an app store</li>
              <li>You can remove it anytime by deleting the home screen icon</li>
              <li>Works on any phone with a modern web browser</li>
              <li>Some advanced features may require an internet connection</li>
            </ul>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
