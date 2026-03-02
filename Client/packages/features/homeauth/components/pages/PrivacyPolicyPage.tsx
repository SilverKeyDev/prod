import StaticPageLayout, {
  EmailLink,
  List,
  Paragraph,
  Section,
} from "@/features/homeauth/components/core/StaticPageLayout";

export default function PrivacyPolicy() {
  return (
    <StaticPageLayout title="Privacy Policy" subtitle="Last updated: 8/27/2025">
      <Section title="1. Introduction">
        <Paragraph>
          Welcome to SilverKey. We respect your privacy and are committed to protecting your
          personal data. This privacy policy will inform you about how we look after your personal
          data when you visit our website and tell you about your privacy rights.
        </Paragraph>
      </Section>

      <Section title="2. Data We Collect">
        <Paragraph>
          We may collect, use, store, and transfer different kinds of personal data about you which
          we have grouped together as follows:
        </Paragraph>
        <List>
          <li>
            <strong>Identity Data</strong> includes first name, last name, username or similar
            identifier.
          </li>
          <li>
            <strong>Contact Data</strong> includes email address and telephone numbers.
          </li>
          <li>
            <strong>Technical Data</strong> includes internet protocol (IP) address, browser type
            and version, and other technology on the devices you use to access this website.
          </li>
        </List>
      </Section>

      <Section title="3. How We Use Your Data">
        <Paragraph>
          We will only use your personal data when the law allows us to. Most commonly, we will use
          your personal data in the following circumstances:
        </Paragraph>
        <List>
          <li>To register you as a new customer.</li>
          <li>To process and deliver your requests.</li>
          <li>To manage our relationship with you.</li>
          <li>To improve our website, products/core/services, and customer relationships.</li>
        </List>
      </Section>

      <Section title="4. Data Security">
        <Paragraph>
          We have put in place appropriate security measures to prevent your personal data from
          being accidentally lost, used, or accessed in an unauthorized way. We limit access to your
          personal data to those employees and other staff who have a business need to know.
        </Paragraph>
      </Section>

      <Section title="5. Your Legal Rights" isLast={true}>
        <Paragraph>
          Under certain circumstances, you have rights under data protection laws in relation to
          your personal data, including the right to:
        </Paragraph>
        <List>
          <li>Request access to your personal data.</li>
          <li>Request correction of your personal data.</li>
          <li>Request erasure of your personal data.</li>
          <li>Object to processing of your personal data.</li>
          <li>Request restriction of processing your personal data.</li>
        </List>
        <Paragraph>
          If you wish to exercise any of the rights set out above, please contact us at{" "}
          <EmailLink href="mailto:privacy@silverkey.com">privacy@silverkey.com</EmailLink>.
        </Paragraph>
      </Section>
    </StaticPageLayout>
  );
}
