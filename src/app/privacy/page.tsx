import AppFooter from '@/components/AppFooter';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div className="py-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-2">Last updated: January 18, 2026</p>
          <p className="text-gray-700 mb-8">
            PNG Events ("we," "us," or "our") is committed to protecting your privacy and personal information.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our
            Progressive Web App (PWA), website, and related services.
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">1.1 Information You Provide Directly</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><strong>Account Information:</strong> Email address, username, password, full name, profile picture</li>
                    <li><strong>Profile Information:</strong> Bio, company/organization, location, contact preferences</li>
                    <li><strong>Contact Information:</strong> Phone number, WhatsApp number, social media links</li>
                    <li><strong>Event Data:</strong> Event titles, descriptions, dates, locations, pricing, images</li>
                    <li><strong>Communications:</strong> Messages sent through our platform, support requests</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">1.2 Information Collected Automatically</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                    <li><strong>Usage Data:</strong> Pages visited, time spent, clicks, scroll behavior, search queries</li>
                    <li><strong>Location Data:</strong> General location based on IP address (for regional content)</li>
                    <li><strong>PWA Data:</strong> App installation status, offline usage patterns, cache data</li>
                    <li><strong>Performance Data:</strong> App load times, error reports, crash data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">1.3 Push Notification Data</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><strong>Subscription Data:</strong> Notification preferences, subscription tokens, device endpoints</li>
                    <li><strong>Interaction Data:</strong> Notification opens, clicks, dismissals</li>
                    <li><strong>Delivery Data:</strong> Notification send status, delivery confirmations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">1.4 Cookies and Tracking Technologies</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><strong>Essential Cookies:</strong> Session management, authentication, security</li>
                    <li><strong>Functional Cookies:</strong> User preferences, language settings, theme choices</li>
                    <li><strong>Analytics Cookies:</strong> Usage patterns, performance metrics, error tracking</li>
                    <li><strong>Local Storage:</strong> Cached data, user preferences, offline content</li>
                    <li><strong>IndexedDB:</strong> Offline event data, user profiles, cached content</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Core Service Provision</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Create and manage your user account and profile</li>
                  <li>Provide event discovery and browsing functionality</li>
                  <li>Enable event creation and management for organizers</li>
                  <li>Facilitate communication between event organizers and attendees</li>
                  <li>Process and display event information and media</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Communication and Notifications</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Send push notifications for new events and updates (with consent)</li>
                  <li>Deliver notifications about saved/favorited events</li>
                  <li>Send platform updates, security alerts, and service announcements</li>
                  <li>Respond to customer support inquiries and requests</li>
                  <li>Send administrative messages and policy updates</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">2.3 Platform Improvement and Analytics</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Analyze usage patterns to improve user experience</li>
                  <li>Monitor platform performance and identify issues</li>
                  <li>Conduct research and development for new features</li>
                  <li>Generate aggregated, anonymized analytics reports</li>
                  <li>Test new features and functionality</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">2.4 PWA and Offline Functionality</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Cache content for offline access and faster loading</li>
                  <li>Synchronize data when connectivity is restored</li>
                  <li>Provide offline event browsing and user profiles</li>
                  <li>Store user preferences and settings locally</li>
                  <li>Enable background updates and automatic synchronization</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing and Disclosure</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 Public Information</h3>
                <p className="text-gray-700 mb-4">
                  Certain information is publicly visible on our platform:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Event titles, descriptions, dates, locations, and images</li>
                  <li>Event organizer names and basic profile information</li>
                  <li>User-generated content and event media</li>
                  <li>Public comments and reviews (when implemented)</li>
                  <li>Aggregated statistics and platform usage data</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 Contact Information Sharing</h3>
                <p className="text-gray-700 mb-4">
                  Contact information visibility depends on user settings and login status:
                </p>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">For Non-Logged-In Users:</h4>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Only basic profile information is visible (name, company, bio)</li>
                    <li>Contact information (email, phone, WhatsApp) is never displayed</li>
                    <li>Event details and descriptions are publicly visible</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">For Logged-In Users:</h4>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Contact information is visible in event modals, creator profiles, and user pages</li>
                    <li>You control which contact methods to share (email, phone, WhatsApp, or none)</li>
                    <li>You can hide all contact information from other users</li>
                    <li>Contact sharing is limited to legitimate event-related communications</li>
                  </ul>
                </div>

                <h3 className="text-xl font-medium text-gray-900 mb-3">3.3 Third-Party Service Providers</h3>
                <p className="text-gray-700 mb-4">We use third-party services that may process your data:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Supabase:</strong> Database hosting, authentication, and API services</li>
                  <li><strong>Vercel:</strong> Web hosting and deployment platform</li>
                  <li><strong>Analytics Services:</strong> Usage tracking and performance monitoring</li>
                  <li><strong>Cloud Storage:</strong> Image and media file storage</li>
                  <li><strong>Push Notification Services:</strong> Browser notification delivery</li>
                </ul>
                <p className="text-gray-700">
                  These providers are bound by data processing agreements and cannot use your data for their own purposes.
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">3.4 Legal Requirements</h3>
                <p className="text-gray-700 mb-4">We may disclose your information when required by law or to protect rights:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>To comply with legal obligations or court orders</li>
                  <li>To protect against fraud, security threats, or illegal activities</li>
                  <li>To enforce our Terms of Service or other agreements</li>
                  <li>To protect the rights, property, or safety of our users or the public</li>
                  <li>In connection with a business transfer or acquisition</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Security Measures</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Encryption:</strong> Data transmitted using HTTPS/TLS encryption</li>
                  <li><strong>Access Controls:</strong> Role-based access and authentication systems</li>
                  <li><strong>Data Storage:</strong> Secure cloud infrastructure with regular backups</li>
                  <li><strong>Monitoring:</strong> Continuous security monitoring and threat detection</li>
                  <li><strong>Updates:</strong> Regular security patches and system updates</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Data Breach Notification</h3>
                <p className="text-gray-700 mb-4">
                  In the event of a security breach affecting your personal information, we will:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Notify affected users within 72 hours of discovery</li>
                  <li>Provide details about the breach and affected data</li>
                  <li>Offer guidance on protective measures you can take</li>
                  <li>Report the breach to relevant authorities as required by law</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">4.3 Your Security Responsibilities</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Keep your account credentials secure and confidential</li>
                  <li>Use strong, unique passwords for your account</li>
                  <li>Enable two-factor authentication when available</li>
                  <li>Report suspicious activity or security concerns immediately</li>
                  <li>Log out of your account when using shared devices</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights and Choices</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Data Access and Portability</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Request a copy of all personal data we hold about you</li>
                  <li>Receive your data in a structured, machine-readable format</li>
                  <li>Access information about how your data is processed</li>
                  <li>Understand the categories of personal data we collect</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Data Correction and Updates</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Update your profile information and preferences at any time</li>
                  <li>Correct inaccurate or incomplete personal information</li>
                  <li>Modify your contact information sharing settings</li>
                  <li>Change your notification and privacy preferences</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">5.3 Data Deletion and Restriction</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Request deletion of your account and associated data</li>
                  <li>Restrict processing of your personal information</li>
                  <li>Object to certain types of data processing</li>
                  <li>Withdraw consent for data processing activities</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">5.4 Notification Preferences</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Opt-in or opt-out of push notifications</li>
                  <li>Choose notification types and delivery methods</li>
                  <li>Manage email communication preferences</li>
                  <li>Control marketing and promotional communications</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">5.5 Cookie Controls</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Accept or reject non-essential cookies through browser settings</li>
                  <li>Clear cookies and local storage data at any time</li>
                  <li>Manage PWA data and offline storage</li>
                  <li>Control analytics and tracking preferences</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900 mb-3">6.1 Active Account Data</h3>
                <p className="text-gray-700 mb-4">
                  We retain your personal information while your account is active and for as long as needed to provide our services.
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-3">6.2 Account Deletion</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Most personal data is deleted within 30 days of account deletion</li>
                  <li>Some data may be retained for legal, regulatory, or legitimate business purposes</li>
                  <li>Public event data may remain visible if it was shared with others</li>
                  <li>Backup data may be retained for up to 90 days for recovery purposes</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">6.3 Inactive Accounts</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Accounts inactive for 2 years may be marked for deletion</li>
                  <li>You will be notified before any automatic deletion occurs</li>
                  <li>You can reactivate your account by logging in before deletion</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">6.4 Legal Retention</h3>
                <p className="text-gray-700">
                  Certain data may be retained longer when required by law, for legal proceedings,
                  or to resolve disputes and enforce our agreements.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                PNG Events operates globally and your data may be transferred to and processed in countries other than Papua New Guinea.
                We ensure appropriate safeguards are in place for international data transfers:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Data is stored on secure cloud infrastructure with international compliance</li>
                <li>We use industry-standard encryption for data in transit and at rest</li>
                <li>Third-party providers are selected for their data protection standards</li>
                <li>We comply with applicable cross-border data transfer regulations</li>
                <li>You can request information about specific data transfer locations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                PNG Events is not intended for children under 13 years of age. We do not knowingly collect personal information
                from children under 13. If we become aware that we have collected personal information from a child under 13,
                we will take steps to delete such information.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Users must be at least 13 years old to create an account</li>
                <li>Parents can contact us to review or delete their child's information</li>
                <li>We do not use children's data for marketing or advertising purposes</li>
                <li>Event content is intended for general audiences unless specifically marked otherwise</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. When we make material changes, we will:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Update the "Last updated" date at the top of this page</li>
                <li>Notify you through platform notifications or email</li>
                <li>Provide a summary of significant changes</li>
                <li>Give you time to review changes before they take effect</li>
                <li>Request renewed consent if required by law</li>
              </ul>
              <p className="text-gray-700">
                Your continued use of PNG Events after changes take effect constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-700 mb-2"><strong>Data Protection Officer:</strong></p>

                  </div>

                  <div>
                    <p className="text-gray-700 mb-2"><strong>Legal Department:</strong></p>
                    <p className="text-gray-700"><a href="mailto:legal@pngevents.com" className="text-blue-600 hover:underline">legal@pngevents.com</a></p>
                  </div>
                  <div>
                    <p className="text-gray-700 mb-2"><strong>Address:</strong></p>
                    <p className="text-gray-700">Papua New Guinea</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mt-4">
                We will respond to your privacy inquiries within 30 days. For urgent data protection concerns,
                please mark your communication as "Urgent Privacy Matter."
              </p>
            </section>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
