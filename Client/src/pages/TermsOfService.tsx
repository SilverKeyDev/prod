import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-brown hover:text-brown/80 transition-colors mb-6"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-navy mb-2">Terms of Service</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="prose max-w-none text-gray-700">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-navy mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing or using the SilverKey platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-navy mb-4">2. Description of Service</h2>
              <p className="mb-4">
                SilverKey provides real estate analytics and reporting services. The services include, but are not limited to, property valuation, market analysis, and investment recommendations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-navy mb-4">3. User Accounts</h2>
              <p className="mb-4">To access certain features of the service, you may be required to create an account. You agree to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Provide accurate, current, and complete information during registration.</li>
                <li>Maintain and promptly update your account information.</li>
                <li>Maintain the security of your password and accept all risks of unauthorized access.</li>
                <li>Notify us immediately if you discover or suspect any security breaches.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-navy mb-4">4. Subscription and Billing</h2>
              <p className="mb-4">
                Certain aspects of the service may be provided for a fee. By selecting a paid service, you agree to pay the specified fees. All fees are non-refundable except as required by law.
              </p>
              <p className="mb-4">We may change our prices at any time by posting notice to your account and/or on our website.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-navy mb-4">5. Intellectual Property</h2>
              <p className="mb-4">
                The service and its original content, features, and functionality are and will remain the exclusive property of SilverKey and its licensors. The service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-navy mb-4">6. Limitation of Liability</h2>
              <p className="mb-4">
                In no event shall SilverKey, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-navy mb-4">7. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right, at our sole discretion, to modify or replace these terms at any time. We will provide at least 30 days' notice before any new terms take effect. By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">8. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at <a href="mailto:legal@silverkey.com" className="text-brown hover:underline">legal@silverkey.com</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
