import { STATIC_LEGAL_CONTACT } from "packages/features/homeauth/utils/staticLegalContact";

import type { ContactUsLayoutPrimitives } from "./types";

const { generalEmail, phoneDisplay, phoneTelHref } = STATIC_LEGAL_CONTACT;
const GENERAL_MAILTO = `mailto:${generalEmail}`;

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
      <Section title="Get in touch">
        <Paragraph>
          Use the contacts below for accounts, product questions, and partnerships. Privacy requests
          should go to the address listed in the Privacy Policy.
        </Paragraph>
      </Section>

      <Section title="Contact information">
        <ContactInfoContainer>
          <ContactInfoBlock
            label="Email"
            value={<EmailLink href={GENERAL_MAILTO}>{generalEmail}</EmailLink>}
          />
          <ContactInfoBlock
            label="Phone"
            value={<EmailLink href={phoneTelHref}>{phoneDisplay}</EmailLink>}
          />
        </ContactInfoContainer>
      </Section>

      <Section title="Common questions">
        <FAQItem question="What is SilverKey?">
          Agent-facing software that ties MLS-backed search, neighborhood writeups, and
          offer-related documentation into one workflow. Buyers interact through their agent.
        </FAQItem>
        <FAQItem question="Who can use SilverKey?">
          SilverKey is built for licensed real estate professionals and teams. Availability may be
          limited during early access; sign up or contact us to learn whether your market and
          brokerage are supported.
        </FAQItem>
        <FAQItem question="How quickly will you respond?">
          We aim to reply to email within one business day. Complex technical or data issues may
          take longer; include your brokerage name and a short description of the issue to help us
          route your message.
        </FAQItem>
      </Section>

      <Section title="Send a message" isLast>
        <Paragraph>
          For detailed questions, email <EmailLink href={GENERAL_MAILTO}>{generalEmail}</EmailLink>{" "}
          with as much context as possible (browser, steps to reproduce, screenshots if relevant).
        </Paragraph>
        <Paragraph className="text-text-secondary text-xs sm:text-sm">
          SilverKey does not provide legal advice. For contract or compliance questions, consult
          your broker or qualified counsel.
        </Paragraph>
      </Section>
    </>
  );
}
