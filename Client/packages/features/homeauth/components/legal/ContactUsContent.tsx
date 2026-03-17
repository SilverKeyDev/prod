import type { ContactUsLayoutPrimitives } from "./types";

const CONTACT_EMAIL = "walzerjayce@gmail.com";
const CONTACT_PHONE = "+1 (858) 265-9936";

export function ContactUsContent({
  Section,
  Paragraph,
  EmailLink,
  ContactInfoContainer,
  ContactInfoBlock,
  FAQItem,
}: ContactUsLayoutPrimitives) {
  return (
    <>
      <Section title="Get in Touch">
        <Paragraph className="space-y-responsive-md">
          We're here to help! Whether you have questions about our services, need technical support,
          or want to provide feedback, we'd love to hear from you.
        </Paragraph>
      </Section>

      <Section title="Contact Information">
        <ContactInfoContainer>
          <ContactInfoBlock
            label="Email"
            value={<EmailLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</EmailLink>}
          />
          <ContactInfoBlock label="Phone" value={CONTACT_PHONE} />
        </ContactInfoContainer>
      </Section>

      <Section title="Frequently Asked Questions">
        <FAQItem question="How quickly will I receive my property report?">
          Most reports are generated within 2-5 minutes. Complex properties or high-demand periods
          may take up to 15 minutes.
        </FAQItem>
        <FAQItem question="What areas do you cover?">
          We provide comprehensive property reports for all 50 US states, covering residential,
          commercial, and investment properties, with solid but slightly less accurate coverage
          globally.
        </FAQItem>
        <FAQItem question="Can I get a refund if I'm not satisfied?">
          Yes! We offer a 30-day money-back guarantee. If you're not completely satisfied with your
          report, contact us for a full refund.
        </FAQItem>
      </Section>

      <Section title="Send Us a Message" isLast>
        <Paragraph>
          For specific inquiries or detailed questions, please email us at{" "}
          <EmailLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</EmailLink> and we'll get back
          to you within 24 hours during business days.
        </Paragraph>
        <Paragraph className="text-responsive-sm text-text-secondary">
          Please include as much detail as possible about your question or issue so we can provide
          you with the most helpful response.
        </Paragraph>
      </Section>
    </>
  );
}
