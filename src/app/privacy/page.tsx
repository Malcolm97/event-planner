import AppFooter from '@/components/AppFooter';
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div className="py-16 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-gray-700 mb-6">PNG Events is committed to protecting your privacy. This policy explains how we handle your personal information:</p>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Collection and Use</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li>We collect basic information to create and manage your account.</li>
            <li>Your email and contact details are used for event notifications and support.</li>
            <li>We do not sell or share your personal data with third parties.</li>
            <li>Cookies are used to improve your experience and for analytics.</li>
            <li>You may request deletion of your account and data at any time.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information and Public Visibility</h2>
          <p className="text-gray-700 mb-4">When you create events on PNG Events, other users may need to contact you for event-related inquiries. You have full control over how your contact information is shared:</p>

          <h3 className="text-xl font-semibold text-gray-900 mb-3">For Non-Logged-In Users:</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Only basic profile information is visible (name, company, bio)</li>
            <li>Contact information (email, phone, WhatsApp) is never displayed</li>
            <li>Event details and descriptions are publicly visible</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3">For Logged-In Users:</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Contact information is visible in the following locations:</li>
            <ul className="list-disc pl-8 text-gray-700 mb-2">
              <li>Event host details in event modals</li>
              <li>Creator profile pages</li>
              <li>User profile pages</li>
            </ul>
            <li>You can choose which contact methods to share (email, phone, both, or none)</li>
            <li>You can optionally provide a WhatsApp number for contact</li>
            <li>You have the option to hide all contact information from other users</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Control Over Contact Information:</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li>You can set your preferred contact method in your profile settings</li>
            <li>You can choose to make your contact information private at any time</li>
            <li>Contact information is only shared for legitimate event-related communications</li>
            <li>We encourage users to respect contact preferences and use contact information responsibly</li>
          </ul>
          <p className="text-gray-700">For privacy concerns, contact us at <a href="mailto:privacy@pngevents.com" className="text-blue-600 hover:underline">privacy@pngevents.com</a>.</p>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
