import { Icon } from "@ui/icons";

import StaticPageLayout, {
  EmailLink,
  List,
  Paragraph,
  Section,
} from "packages/features/homeauth/components/core/StaticPageLayout";

import { BodyText, Title } from "@/components/ui";

import { ContactUsContent } from "./ContactUsContent";

function ContactInfoContainer({ children }: { children: React.ReactNode }) {
  return <div className="gap-responsive-md grid grid-cols-1 md:grid-cols-2">{children}</div>;
}

function ContactInfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="gap-responsive-sm flex items-start">
      {label === "Email" ? (
        <Icon name="mail" className="mobile-icon-sm text-brown mt-1 flex-shrink-0" />
      ) : (
        <Icon name="phone" className="mobile-icon-sm text-brown mt-1 flex-shrink-0" />
      )}
      <div>
        <Title as="h3" size="sm" className="space-y-responsive-xs font-semibold text-black">
          {label}
        </Title>
        <BodyText as="p" size="sm" className="text-responsive-sm text-gray-600">
          {value}
        </BodyText>
      </div>
    </div>
  );
}

function FAQItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div>
      <Title as="h3" size="sm" className="space-y-responsive-xs font-semibold text-black">
        {question}
      </Title>
      <BodyText as="p" size="sm" className="space-y-responsive-sm text-responsive-sm text-gray-600">
        {children}
      </BodyText>
    </div>
  );
}

export function ContactUsFeature() {
  return (
    <StaticPageLayout title="Contact Us" subtitle="Last updated: 8/27/2025" centered>
      <ContactUsContent
        Section={Section}
        Paragraph={Paragraph}
        List={List}
        EmailLink={EmailLink}
        ContactInfoContainer={ContactInfoContainer}
        ContactInfoBlock={ContactInfoBlock}
        FAQItem={FAQItem}
      />
    </StaticPageLayout>
  );
}
