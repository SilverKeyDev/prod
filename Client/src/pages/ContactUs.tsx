import { Link } from "react-router-dom";
import { ChevronLeft, Mail, Phone, MapPin, Clock } from "lucide-react";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="relative">
            <Link
              to="/"
              className="absolute top-0 left-0 inline-flex items-center text-black hover:text-black/80 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back to Home
            </Link>
            <div className="text-center pt-8 sm:pt-0">
              <h1 className="text-3xl font-bold text-black mb-2">Contact Us</h1>
              <p className="text-gray-600">Get in touch with our team</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="prose max-w-none text-gray-700">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">Get in Touch</h2>
              <p className="mb-6">
                We're here to help! Whether you have questions about our services, need technical support, or want to provide feedback, we'd love to hear from you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-brown mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-black mb-1">Email</h3>
                    <p className="text-gray-600">
                      <a href="mailto:support@silverkey.com" className="text-black hover:underline">
                        walzerjayce@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-brown mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-black mb-1">Phone</h3>
                    <p className="text-gray-600">
                      <a href="tel:+1-555-SILVER" className="text-black hover:underline">
                        +1 (858) 265-9936
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-black mb-2">How quickly will I receive my property report?</h3>
                  <p className="text-gray-600 mb-4">
                    Most reports are generated within 2-5 minutes. Complex properties or high-demand periods may take up to 15 minutes.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-black mb-2">What areas do you cover?</h3>
                  <p className="text-gray-600 mb-4">
                    We provide comprehensive property reports for all 50 US states, covering residential, commercial, and investment properties, with solid but slightly less accurate coverage globally.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-black mb-2">Can I get a refund if I'm not satisfied?</h3>
                  <p className="text-gray-600 mb-4">
                    Yes! We offer a 30-day money-back guarantee. If you're not completely satisfied with your report, contact us for a full refund.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">Send Us a Message</h2>
              <p className="mb-4">
                For specific inquiries or detailed questions, please email us at{" "}
                <a href="mailto:walzerjayce@gmail.com" className="text-black hover:underline">
                  walzerjayce@gmail.com
                </a>{" "}
                and we'll get back to you within 24 hours during business days.
              </p>
              <p className="text-gray-600">
                Please include as much detail as possible about your question or issue so we can provide you with the most helpful response.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
