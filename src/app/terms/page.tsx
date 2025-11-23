import AppFooter from '@/components/AppFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div className="py-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <p className="text-gray-600 mb-2">Last updated: November 23, 2025</p>
          <p className="text-gray-700 mb-8">
            Welcome to PNG Events, Papua New Guinea's premier event discovery and management platform.
            By accessing or using our Progressive Web App (PWA), website, or services, you agree to be bound by these Terms of Service.
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By creating an account, accessing our platform, or using any of our services, you acknowledge that you have read,
                understood, and agree to be bound by these Terms of Service and our Privacy Policy.
              </p>
              <p className="text-gray-700">
                If you do not agree to these terms, please do not use PNG Events.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                PNG Events is a comprehensive event discovery and management platform that provides:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Event discovery and browsing for concerts, festivals, workshops, and community events in Papua New Guinea</li>
                <li>Event creation and management tools for organizers</li>
                <li>User profiles and networking features for event creators and attendees</li>
                <li>Progressive Web App (PWA) functionality with offline access</li>
                <li>Push notification services for event updates and announcements</li>
                <li>Administrative dashboard for platform management</li>
                <li>Real-time event updates and community features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900">Account Creation</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>You must be at least 13 years old to create an account</li>
                  <li>You must provide accurate, current, and complete information during registration</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You must immediately notify us of any unauthorized use of your account</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">Account Types</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Regular Users:</strong> Can browse events, save favorites, and interact with event content</li>
                  <li><strong>Event Creators:</strong> Can create and manage events, access creator tools</li>
                  <li><strong>Administrators:</strong> Have access to platform management and moderation tools</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Progressive Web App (PWA) Usage</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900">PWA Features</h3>
                <p className="text-gray-700 mb-4">
                  Our platform offers PWA functionality that allows installation on supported devices:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Offline access to cached events and user data</li>
                  <li>Background synchronization when connectivity is restored</li>
                  <li>Push notifications for event updates and announcements</li>
                  <li>Native app-like experience on mobile devices</li>
                  <li>Automatic updates and service worker management</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">PWA Responsibilities</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>You acknowledge that PWA functionality requires browser permissions</li>
                  <li>You are responsible for managing your device's storage and cache</li>
                  <li>Service worker updates may occur automatically to improve functionality</li>
                  <li>You can uninstall the PWA through your device's app management settings</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Push Notifications</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900">Notification Services</h3>
                <p className="text-gray-700 mb-4">
                  PNG Events provides push notification services to keep users informed about:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>New event announcements and updates</li>
                  <li>Changes to saved/favorited events</li>
                  <li>Platform updates and important announcements</li>
                  <li>Event reminders and time-sensitive information</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">Notification Consent</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Push notifications require explicit user consent</li>
                  <li>You can manage notification preferences in your account settings</li>
                  <li>You can unsubscribe from notifications at any time</li>
                  <li>Notification delivery depends on device and browser capabilities</li>
                  <li>We respect Do Not Disturb settings and platform notification policies</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Event Creation and Management</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900">Event Content Guidelines</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>All event information must be accurate and up-to-date</li>
                  <li>Event descriptions must not contain misleading or fraudulent information</li>
                  <li>You are responsible for ensuring your events comply with local laws and regulations</li>
                  <li>Event pricing and ticket information must be clearly disclosed</li>
                  <li>You must have necessary permissions and rights to host the advertised event</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">Content Ownership</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>You retain ownership of content you create (events, profiles, descriptions)</li>
                  <li>By posting content, you grant PNG Events a non-exclusive license to display and distribute it</li>
                  <li>You are responsible for ensuring you have rights to use any third-party content in your events</li>
                  <li>Event images and media must not infringe on others' intellectual property rights</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">Event Moderation</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>PNG Events reserves the right to review, modify, or remove event listings</li>
                  <li>Events may be removed for violations of these terms or community guidelines</li>
                  <li>Repeated violations may result in account suspension or termination</li>
                  <li>Event organizers are responsible for managing their event communications</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. User Conduct and Prohibited Activities</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900">Acceptable Use</h3>
                <p className="text-gray-700 mb-4">You agree to use PNG Events responsibly and in compliance with applicable laws.</p>

                <h3 className="text-xl font-medium text-gray-900">Prohibited Activities</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Creating fake, misleading, or fraudulent event listings</li>
                  <li>Harassing, abusing, or threatening other users</li>
                  <li>Posting inappropriate, offensive, or illegal content</li>
                  <li>Attempting to gain unauthorized access to our systems</li>
                  <li>Using automated tools, bots, or scraping our platform</li>
                  <li>Impersonating other individuals or organizations</li>
                  <li>Violating intellectual property rights of others</li>
                  <li>Distributing malware or engaging in cyber attacks</li>
                  <li>Manipulating platform features or abusing reporting systems</li>
                  <li>Creating multiple accounts for deceptive purposes</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property Rights</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900">Platform IP</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>The PNG Events platform, including software, design, logos, and branding, is protected by intellectual property laws</li>
                  <li>You may not copy, modify, distribute or reverse engineer our platform without permission</li>
                  <li>Unauthorized use of our intellectual property may result in legal action</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">User Content License</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>You grant PNG Events a worldwide, non-exclusive license to use, display, and distribute your content</li>
                  <li>This license is necessary for platform operation and content delivery</li>
                  <li>You remain the owner of your original content and can remove it at any time</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy,
                which is incorporated into these Terms by reference.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We collect information necessary to provide our services</li>
                <li>Your data is protected using industry-standard security measures</li>
                <li>You have rights regarding your personal data as outlined in our Privacy Policy</li>
                <li>We comply with applicable data protection laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Service Availability and Disclaimers</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900">Service Availability</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>We strive to provide continuous service but cannot guarantee 100% uptime</li>
                  <li>Scheduled maintenance may temporarily interrupt service</li>
                  <li>PWA functionality depends on device and browser capabilities</li>
                  <li>Offline features are available when cached data is present</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">Disclaimers</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Event information is provided by organizers and may change without notice</li>
                  <li>We do not guarantee the accuracy, completeness, or availability of event information</li>
                  <li>You are responsible for verifying event details before attending</li>
                  <li>We are not responsible for the actions or omissions of event organizers</li>
                  <li>Platform is provided "as is" without warranties of any kind</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, PNG Events shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages arising from your use of our platform.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Our total liability shall not exceed the amount paid by you for our services in the 12 months preceding the claim</li>
                <li>We are not liable for losses resulting from event cancellations or changes</li>
                <li>We are not responsible for third-party content or external links</li>
                <li>You use our platform at your own risk</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Account Termination</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900">Termination by User</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>You may delete your account at any time through account settings</li>
                  <li>Account deletion will remove your profile and associated data</li>
                  <li>Some data may be retained for legal or legitimate business purposes</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900">Termination by PNG Events</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>We may suspend or terminate accounts that violate these terms</li>
                  <li>We will provide notice when possible before termination</li>
                  <li>Terminated accounts lose access to all platform features</li>
                  <li>Appeals can be submitted through our support channels</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We may update these Terms of Service from time to time. When we make changes, we will:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Update the "Last updated" date at the top of this page</li>
                <li>Notify users through platform notifications or email</li>
                <li>Provide a summary of significant changes</li>
                <li>Give users time to review changes before they take effect</li>
              </ul>
              <p className="text-gray-700">
                Continued use of our platform after changes take effect constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Governing Law</h2>
              <p className="text-gray-700">
                These Terms of Service are governed by the laws of Papua New Guinea. Any disputes arising from these terms
                or your use of our platform will be resolved through the courts of Papua New Guinea.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Address:</strong> Papua New Guinea</p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
