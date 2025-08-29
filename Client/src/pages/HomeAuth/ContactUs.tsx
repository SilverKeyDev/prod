import { Mail, Phone} from "lucide-react";
import StaticPageLayout, { Section, Paragraph, EmailLink } from "../../components/layout/StaticPageLayout";

export default function ContactUs() {
  return (
    <StaticPageLayout
      title="Contact Us"
      subtitle="Last updated: 8/27/2025"
      centered={true}
    >
      <Section title="Get in Touch">
        <Paragraph className="space-y-responsive-md">
          We're here to help! Whether you have questions about our services, need technical support, or want to provide feedback, we'd love to hear from you.
        </Paragraph>
      </Section>

      <Section title="Contact Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-responsive-md">
          <div className="flex items-start gap-responsive-sm">
            <Mail className="mobile-icon-sm text-brown mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-black space-y-responsive-xs">Email</h3>
              <p className="text-responsive-sm text-gray-600">
                <EmailLink href="mailto:walzerjayce@gmail.com">
                  walzerjayce@gmail.com
                </EmailLink>
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-responsive-sm">
            <Phone className="mobile-icon-sm text-brown mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-black space-y-responsive-xs">Phone</h3>
              <p className="text-responsive-sm text-gray-600">
                <a href="tel:+18582659936" className="text-black hover:underline">
                  +1 (858) 265-9936
                </a>
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Frequently Asked Questions">
        <div className="space-y-responsive-sm">
          <div>
            <h3 className="font-semibold text-black space-y-responsive-xs">How quickly will I receive my property report?</h3>
            <p className="text-responsive-sm text-gray-600 space-y-responsive-sm">
              Most reports are generated within 2-5 minutes. Complex properties or high-demand periods may take up to 15 minutes.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-black space-y-responsive-xs">What areas do you cover?</h3>
            <p className="text-responsive-sm text-gray-600 space-y-responsive-sm">
              We provide comprehensive property reports for all 50 US states, covering residential, commercial, and investment properties, with solid but slightly less accurate coverage globally.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-black space-y-responsive-xs">Can I get a refund if I'm not satisfied?</h3>
            <p className="text-responsive-sm text-gray-600 space-y-responsive-sm">
              Yes! We offer a 30-day money-back guarantee. If you're not completely satisfied with your report, contact us for a full refund.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Send Us a Message" isLast={true}>
        <Paragraph>
          For specific inquiries or detailed questions, please email us at{" "}
          <EmailLink href="mailto:walzerjayce@gmail.com">
            walzerjayce@gmail.com
          </EmailLink>{" "}
          and we'll get back to you within 24 hours during business days.
        </Paragraph>
        <Paragraph className="text-responsive-sm text-gray-600">
          Please include as much detail as possible about your question or issue so we can provide you with the most helpful response.
        </Paragraph>
      </Section>
    </StaticPageLayout>
  );
}
