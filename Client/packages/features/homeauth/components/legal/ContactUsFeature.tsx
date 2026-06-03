import { Icon } from "@ui/icons";

import StaticPageLayout, {
  Bold,
  EmailLink,
  List,
  ListItem,
  Paragraph,
  Section,
} from "packages/features/homeauth/components/core/StaticPageLayout";
import { Box } from "packages/ui/components/primitives";
import { ICON_SIZE_CLASSES } from "packages/ui/styles/variants/iconButtonVariants";
import { LEGAL_PAGES_LAST_UPDATED } from "packages/utils/legal/staticLegalContact";

import { BodyText, Title } from "@/components/ui";

import { ContactUsContent } from "./ContactUsContent";
function ContactInfoContainer({ children }: { children: React.ReactNode }) {
  return <Box className="gap-responsive-md grid-responsive-1-md-2">{children}</Box>;
}
function ContactInfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box className="gap-responsive-sm flex flex-row items-start">
      {label === "Email" ? (
        <Icon
          name="mail"
          className={`${ICON_SIZE_CLASSES.sm} text-foreground mt-1 flex-shrink-0`}
        />
      ) : (
        <Icon
          name="phone"
          className={`${ICON_SIZE_CLASSES.sm} text-foreground mt-1 flex-shrink-0`}
        />
      )}
      <Box>
        <Title as="h3" size="sm" className="text-text-primary flex flex-col gap-1 font-semibold">
          {label}
        </Title>
        <BodyText as="p" size="sm" className="text-responsive-sm text-text-secondary">
          {value}
        </BodyText>
      </Box>
    </Box>
  );
}
function FAQItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <Box>
      <Title as="h3" size="sm" className="text-text-primary flex flex-col gap-1 font-semibold">
        {question}
      </Title>
      <BodyText
        as="p"
        size="sm"
        className="text-responsive-sm text-text-secondary flex flex-col gap-2"
      >
        {children}
      </BodyText>
    </Box>
  );
}
export function ContactUsFeature() {
  return (
    <StaticPageLayout
      title="Contact us"
      subtitle={LEGAL_PAGES_LAST_UPDATED}
      legalSuiteActive="contact"
    >
      <ContactUsContent
        Section={Section}
        Paragraph={Paragraph}
        List={List}
        ListItem={ListItem}
        Bold={Bold}
        EmailLink={EmailLink}
        ContactInfoContainer={ContactInfoContainer}
        ContactInfoBlock={ContactInfoBlock}
        FAQItem={FAQItem}
      />
    </StaticPageLayout>
  );
}
