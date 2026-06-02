import { STATIC_LEGAL_CONTACT } from "packages/utils/legal/staticLegalContact";

import type { LegalLayoutPrimitives } from "./types";

export function TermsOfServiceContent(props: LegalLayoutPrimitives) {
  const { Section, Paragraph, List, ListItem, EmailLink } = props;
  const legalMail = `mailto:${STATIC_LEGAL_CONTACT.legalEmail}`;

  return (
    <>
      <Section title="1. Agreement to terms">
        <Paragraph>
          These Terms of Service (“Terms”) govern your access to and use of SilverKey’s websites,
          applications, and services (the “Services”). By creating an account, clicking to accept,
          or using the Services, you agree to these Terms. If you are using the Services on behalf
          of a company or brokerage, you represent that you have authority to bind that
          organization.
        </Paragraph>
      </Section>

      <Section title="2. The Services">
        <Paragraph>
          SilverKey provides tools for real estate professionals and their clients to coordinate
          home search, analysis, offer-related work, and related documentation. Features may include
          integrations with MLS or third-party data providers where available. Listing data and
          third-party content remain subject to the applicable provider’s terms and licenses.
        </Paragraph>
        <Paragraph>
          Some features produce algorithmic or model-generated text and recommendations. Outputs are
          informational and do not constitute legal, tax, financial, or investment advice. You are
          responsible for reviewing and approving any materials before sharing or filing them.
        </Paragraph>
      </Section>

      <Section title="3. Eligibility and accounts">
        <Paragraph>
          You must be at least 18 years old, or the age of majority in your jurisdiction if that is
          higher, to create an account. The Services are not directed to children under 13, and you
          may not use the Services if you are a child under 13.
        </Paragraph>
        <Paragraph>To use the Services, you agree that you will:</Paragraph>
        <List>
          <ListItem>Provide accurate registration information and keep it up to date.</ListItem>
          <ListItem>
            Maintain the confidentiality of your credentials and restrict account access.
          </ListItem>
          <ListItem>
            Notify us promptly of any unauthorized use or security incident related to your account.
          </ListItem>
          <ListItem>
            Comply with applicable real estate laws, MLS rules, brokerage policies, and fair housing
            obligations when using the Services.
          </ListItem>
        </List>
      </Section>

      <Section title="4. Acceptable use">
        <Paragraph>You will not (and will not permit others to):</Paragraph>
        <List>
          <ListItem>
            Use the Services in any unlawful manner or to violate others’ rights, including privacy
            and intellectual property rights.
          </ListItem>
          <ListItem>
            Scrape, mine, or excessively automate access to the Services except as we expressly
            permit.
          </ListItem>
          <ListItem>
            Reverse engineer, circumvent security, or probe the Services except as allowed by law.
          </ListItem>
          <ListItem>
            Upload malware, spam, or content that is defamatory, harassing, or discriminatory.
          </ListItem>
        </List>
      </Section>

      <Section title="5. Fees and trials">
        <Paragraph>
          Certain features may be free, in beta, or offered for a fee. If you purchase a paid plan,
          you agree to the pricing and billing terms presented at checkout. Unless stated otherwise,
          fees are non-refundable except as required by law. We may change pricing with reasonable
          advance notice.
        </Paragraph>
      </Section>

      <Section title="6. Intellectual property">
        <Paragraph>
          SilverKey and its licensors own the Services, including software, branding, and content we
          create (excluding your data and third-party listing content). We grant you a limited,
          non-exclusive, non-transferable license to use the Services during your subscription or
          access period, subject to these Terms.
        </Paragraph>
      </Section>

      <Section title="7. Disclaimers">
        <Paragraph>
          THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY
          LAW, SILVERKEY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT
          THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT MLS OR THIRD-PARTY DATA WILL
          BE COMPLETE OR CURRENT.
        </Paragraph>
      </Section>

      <Section title="8. Limitation of liability">
        <Paragraph>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, SILVERKEY AND ITS AFFILIATES, OFFICERS, EMPLOYEES,
          AND SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
          EXEMPLARY DAMAGES, OR FOR LOST PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO
          YOUR USE OF THE SERVICES. OUR AGGREGATE LIABILITY FOR CLAIMS RELATING TO THE SERVICES WILL
          NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICES IN THE TWELVE
          MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS (US $100), EXCEPT WHERE PROHIBITED
          BY LAW.
        </Paragraph>
      </Section>

      <Section title="9. Indemnity">
        <Paragraph>
          You will defend and indemnify SilverKey against claims, damages, and expenses (including
          reasonable attorneys’ fees) arising from your use of the Services, your content or data,
          or your violation of these Terms or applicable law, except to the extent caused by our
          gross negligence or willful misconduct.
        </Paragraph>
      </Section>

      <Section title="10. Termination">
        <Paragraph>
          You may stop using the Services at any time. We may suspend or terminate access if you
          breach these Terms, create risk or legal exposure, or if we discontinue the Services with
          reasonable notice where practicable. Provisions that by their nature should survive will
          survive termination.
        </Paragraph>
      </Section>

      <Section title="11. Changes">
        <Paragraph>
          We may modify these Terms from time to time. We will post the updated Terms and update the
          “Last updated” date. If a change is material, we will provide additional notice as
          appropriate. Continued use after the effective date constitutes acceptance of the revised
          Terms.
        </Paragraph>
      </Section>

      <Section title="12. Contact" isLast>
        <Paragraph>
          For questions about these Terms, contact{" "}
          <EmailLink href={legalMail}>{STATIC_LEGAL_CONTACT.legalEmail}</EmailLink>.
        </Paragraph>
      </Section>
    </>
  );
}
