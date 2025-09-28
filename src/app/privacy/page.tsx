import AppFooter from '@/components/AppFooter';
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div className="py-16 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-gray-700 mb-6">PNG Events is committed to protecting your privacy. This policy explains how we handle your personal information:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li>We collect basic information to create and manage your account.</li>
            <li>Your email and contact details are used for event notifications and support.</li>
            <li>We do not sell or share your personal data with third parties.</li>
            <li>Cookies are used to improve your experience and for analytics.</li>
            <li>You may request deletion of your account and data at any time.</li>
          </ul>
          <p className="text-gray-700">For privacy concerns, contact us at <a href="mailto:privacy@pngevents.com" className="text-blue-600 hover:underline">privacy@pngevents.com</a>.</p>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
