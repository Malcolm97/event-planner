import AppFooter from '@/components/AppFooter';
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
      <AppFooter />
    </div>
  );
}
