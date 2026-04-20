import { STATIC_LEGAL_CONTACT } from "packages/features/homeauth/utils/staticLegalContact";

import type { LegalLayoutPrimitives } from "./types";

export function PrivacyPolicyContent({
  Section,
  Paragraph,
  List,
  ListItem,
  Bold,
  EmailLink,
}: LegalLayoutPrimitives) {
  const privacyMail = `mailto:${STATIC_LEGAL_CONTACT.privacyEmail}`;

  return (
    <>
      <Section title="1. Introduction">
        <Paragraph>
          SilverKey (“we,” “us,” or “our”) provides software and services that help real estate
          professionals and their clients work through the home search and transaction workflow.
          This Privacy Policy explains how we collect, use, disclose, and safeguard information when
          you use our websites, applications, and related services (collectively, the “Services”).
        </Paragraph>
        <Paragraph>
          By using the Services, you agree to the collection and use of information in accordance
          with this policy. If you do not agree, please discontinue use of the Services.
        </Paragraph>
      </Section>

      <Section title="2. Information we collect">
        <Paragraph>We may collect the following categories of information:</Paragraph>
        <List>
          <ListItem>
            <Bold>Account and identity data</Bold> - name, email address, phone number, brokerage or
            team affiliation, and similar identifiers you provide when you register or communicate
            with us.
          </ListItem>
          <ListItem>
            <Bold>Profile and preferences</Bold> - buyer or client preferences, saved searches,
            favorites, and related inputs you or your clients submit to inform search filters,
            ranking, and workflows.
          </ListItem>
          <ListItem>
            <Bold>Transaction and usage data</Bold> - actions you take in the product (e.g.
            documents generated, offers or tasks initiated), log data, and diagnostic information
            used to operate and improve the Services.
          </ListItem>
          <ListItem>
            <Bold>Technical data</Bold> - IP address, device type, browser type, approximate
            location derived from IP, and cookies or similar technologies as described below.
          </ListItem>
          <ListItem>
            <Bold>Third-party and MLS-related data</Bold> - where you connect integrations or we
            display listing content, we may receive property, market, or identity data from partners
            subject to their terms and your authorization.
          </ListItem>
        </List>
      </Section>

      <Section title="3. How we use information">
        <Paragraph>We use information to:</Paragraph>
        <List>
          <ListItem>
            Provide, maintain, and improve the Services, including model-assisted outputs.
          </ListItem>
          <ListItem>Authenticate users, prevent fraud, and protect security.</ListItem>
          <ListItem>
            Communicate with you about your account, updates, and support requests.
          </ListItem>
          <ListItem>Comply with law, enforce our agreements, and defend our legal rights.</ListItem>
          <ListItem>
            Analyze usage in aggregate or de-identified form to improve product quality and
            reliability.
          </ListItem>
        </List>
      </Section>

      <Section title="4. Sharing and disclosure">
        <Paragraph>We may share information:</Paragraph>
        <List>
          <ListItem>
            With service providers who assist us (e.g. hosting, analytics, email delivery), under
            confidentiality and data-processing terms.
          </ListItem>
          <ListItem>
            With your direction - for example, sharing outputs with clients or collaborators you
            designate within the product.
          </ListItem>
          <ListItem>
            When required by law, legal process, or to protect the rights, property, or safety of
            SilverKey, our users, or others.
          </ListItem>
          <ListItem>
            In connection with a merger, acquisition, or sale of assets, with notice as required by
            law.
          </ListItem>
        </List>
        <Paragraph>
          We do not sell your personal information as that term is commonly defined.
        </Paragraph>
      </Section>

      <Section title="5. Cookies and similar technologies">
        <Paragraph>
          We use cookies and similar technologies to keep you signed in, remember preferences,
          measure performance, and improve the Services. You can control cookies through your
          browser settings; disabling cookies may limit certain features.
        </Paragraph>
      </Section>

      <Section title="6. Data retention and security">
        <Paragraph>
          We retain information for as long as needed to provide the Services, comply with legal
          obligations, resolve disputes, and enforce our agreements. We implement administrative,
          technical, and organizational measures designed to protect personal data; no method of
          transmission or storage is completely secure.
        </Paragraph>
      </Section>

      <Section title="7. Your rights and choices">
        <Paragraph>
          Depending on where you live, you may have rights to access, correct, delete, or restrict
          certain processing of your personal data, or to object to processing or request
          portability. To exercise these rights, contact us using the email below. We may need to
          verify your request before responding.
        </Paragraph>
      </Section>

      <Section title="8. Children’s privacy">
        <Paragraph>
          The Services are not directed to children under 13 (or the minimum age in your
          jurisdiction), and we do not knowingly collect personal information from children. If you
          believe we have collected such information, please contact us and we will take appropriate
          steps to delete it.
        </Paragraph>
      </Section>

      <Section title="9. Changes to this policy">
        <Paragraph>
          We may update this Privacy Policy from time to time. We will post the revised policy on
          this page and update the “Last updated” date. Material changes may require additional
          notice as required by law.
        </Paragraph>
      </Section>

      <Section title="10. Contact us" isLast>
        <Paragraph>
          Questions or requests regarding this Privacy Policy or your data may be sent to{" "}
          <EmailLink href={privacyMail}>{STATIC_LEGAL_CONTACT.privacyEmail}</EmailLink>.
        </Paragraph>
      </Section>
    </>
  );
}
