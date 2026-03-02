import type { LegalLayoutPrimitives } from "./types";

export function PrivacyPolicyContent({
  Section,
  Paragraph,
  List,
  ListItem,
  Bold,
  EmailLink,
}: LegalLayoutPrimitives) {
  return (
    <>
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
          <ListItem>
            <Bold>Identity Data</Bold> includes first name, last name, username or similar
            identifier.
          </ListItem>
          <ListItem>
            <Bold>Contact Data</Bold> includes email address and telephone numbers.
          </ListItem>
          <ListItem>
            <Bold>Technical Data</Bold> includes internet protocol (IP) address, browser type and
            version, and other technology on the devices you use to access this website.
          </ListItem>
        </List>
      </Section>

      <Section title="3. How We Use Your Data">
        <Paragraph>
          We will only use your personal data when the law allows us to. Most commonly, we will use
          your personal data in the following circumstances:
        </Paragraph>
        <List>
          <ListItem>To register you as a new customer.</ListItem>
          <ListItem>To process and deliver your requests.</ListItem>
          <ListItem>To manage our relationship with you.</ListItem>
          <ListItem>
            To improve our website, products/core/services, and customer relationships.
          </ListItem>
        </List>
      </Section>

      <Section title="4. Data Security">
        <Paragraph>
          We have put in place appropriate security measures to prevent your personal data from
          being accidentally lost, used, or accessed in an unauthorized way. We limit access to your
          personal data to those employees and other staff who have a business need to know.
        </Paragraph>
      </Section>

      <Section title="5. Your Legal Rights" isLast>
        <Paragraph>
          Under certain circumstances, you have rights under data protection laws in relation to
          your personal data, including the right to:
        </Paragraph>
        <List>
          <ListItem>Request access to your personal data.</ListItem>
          <ListItem>Request correction of your personal data.</ListItem>
          <ListItem>Request erasure of your personal data.</ListItem>
          <ListItem>Object to processing of your personal data.</ListItem>
          <ListItem>Request restriction of processing your personal data.</ListItem>
        </List>
        <Paragraph>
          If you wish to exercise any of the rights set out above, please contact us at{" "}
          <EmailLink href="mailto:privacy@silverkey.com">privacy@silverkey.com</EmailLink>.
        </Paragraph>
      </Section>
    </>
  );
}
