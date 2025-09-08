import StaticPageLayout, {
  Section,
  Paragraph,
  List,
  EmailLink,
} from "../../features/homeauth/StaticPageLayout";

export default function TermsOfService() {
  return (
    <StaticPageLayout
      title="Terms of Service"
      subtitle="Last updated: 8/27/2025"
    >
      <Section title="1. Acceptance of Terms">
        <Paragraph>
          By accessing or using the SilverKey platform, you agree to be bound by
          these Terms of Service. If you do not agree to these terms, please do
          not use our services.
        </Paragraph>
      </Section>

      <Section title="2. Description of Service">
        <Paragraph>
          SilverKey provides real estate analytics and reporting services. The
          services include, but are not limited to, property valuation, market
          analysis, and investment recommendations.
        </Paragraph>
      </Section>

      <Section title="3. User Accounts">
        <Paragraph>
          To access certain features of the service, you may be required to
          create an account. You agree to:
        </Paragraph>
        <List>
          <li>
            Provide accurate, current, and complete information during
            registration.
          </li>
          <li>Maintain and promptly update your account information.</li>
          <li>
            Maintain the security of your password and accept all risks of
            unauthorized access.
          </li>
          <li>
            Notify us immediately if you discover or suspect any security
            breaches.
          </li>
        </List>
      </Section>

      <Section title="4. Subscription and Billing">
        <Paragraph>
          Certain aspects of the service may be provided for a fee. By selecting
          a paid service, you agree to pay the specified fees. All fees are
          non-refundable except as required by law.
        </Paragraph>
        <Paragraph>
          We may change our prices at any time by posting notice to your account
          and/or on our website.
        </Paragraph>
      </Section>

      <Section title="5. Intellectual Property">
        <Paragraph>
          The service and its original content, features, and functionality are
          and will remain the exclusive property of SilverKey and its licensors.
          The service is protected by copyright, trademark, and other laws of
          both the United States and foreign countries.
        </Paragraph>
      </Section>

      <Section title="6. Limitation of Liability">
        <Paragraph>
          In no event shall SilverKey, nor its directors, employees, partners,
          agents, suppliers, or affiliates, be liable for any indirect,
          incidental, special, consequential or punitive damages, including
          without limitation, loss of profits, data, use, goodwill, or other
          intangible losses, resulting from your access to or use of or
          inability to access or use the service.
        </Paragraph>
      </Section>

      <Section title="7. Changes to Terms">
        <Paragraph>
          We reserve the right, at our sole discretion, to modify or replace
          these terms at any time. We will provide at least 30 days' notice
          before any new terms take effect. By continuing to access or use our
          service after those revisions become effective, you agree to be bound
          by the revised terms.
        </Paragraph>
      </Section>

      <Section title="8. Contact Us" isLast={true}>
        <Paragraph>
          If you have any questions about these Terms, please contact us at{" "}
          <EmailLink href="mailto:legal@silverkey.com">
            legal@silverkey.com
          </EmailLink>
          .
        </Paragraph>
      </Section>
    </StaticPageLayout>
  );
}
