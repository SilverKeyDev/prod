import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-4xl mx-auto px-responsive-sm py-responsive-lg">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-black hover:text-black/80 transition-colors space-y-responsive-md"
          >
            <ChevronLeft className="mobile-icon-sm mr-1" />
            Back to Home
          </Link>
          <h1 className="text-responsive-xl font-bold text-black space-y-responsive-xs">Privacy Policy</h1>
          <p className="text-responsive-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm space-responsive-md">
          <div className="prose max-w-none text-responsive-sm text-gray-700">
            <section className="mb-8">
              <h2 className="text-responsive-lg font-semibold text-black space-y-responsive-sm">1. Introduction</h2>
              <p className="space-y-responsive-sm">
                Welcome to SilverKey. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-responsive-lg font-semibold text-black space-y-responsive-sm">2. Data We Collect</h2>
              <p className="space-y-responsive-sm">We may collect, use, store, and transfer different kinds of personal data about you which we have grouped together as follows:</p>
              <ul className="list-disc pl-6 space-y-responsive-sm space-y-responsive-xs">
                <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
                <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, and other technology on the devices you use to access this website.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-responsive-lg font-semibold text-black space-y-responsive-sm">3. How We Use Your Data</h2>
              <p className="space-y-responsive-sm">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-responsive-sm space-y-responsive-xs">
                <li>To register you as a new customer.</li>
                <li>To process and deliver your requests.</li>
                <li>To manage our relationship with you.</li>
                <li>To improve our website, products/services, and customer relationships.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-responsive-lg font-semibold text-black space-y-responsive-sm">4. Data Security</h2>
              <p className="space-y-responsive-sm">
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal data to those employees and other staff who have a business need to know.
              </p>
            </section>

            <section>
              <h2 className="text-responsive-lg font-semibold text-black space-y-responsive-sm">5. Your Legal Rights</h2>
              <p className="space-y-responsive-sm">Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
              <ul className="list-disc pl-6 space-y-responsive-xs space-y-responsive-md">
                <li>Request access to your personal data.</li>
                <li>Request correction of your personal data.</li>
                <li>Request erasure of your personal data.</li>
                <li>Object to processing of your personal data.</li>
                <li>Request restriction of processing your personal data.</li>
              </ul>
              <p>If you wish to exercise any of the rights set out above, please contact us at <a href="mailto:privacy@silverkey.com" className="text-black hover:underline">privacy@silverkey.com</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
