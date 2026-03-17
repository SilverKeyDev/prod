import { Icon } from "@ui/icons";

import StaticPageLayout, {
  EmailLink,
  List,
  Paragraph,
  Section,
} from "packages/features/homeauth/components/core/StaticPageLayout";
import { Box } from "packages/ui/components/primitives";
import { ICON_SIZE_CLASSES } from "packages/ui/styles/variants/iconButtonVariants";

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
          // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
          className={`${ICON_SIZE_CLASSES.sm} text-foreground mt-1 flex-shrink-0`}
        />
      ) : (
        <Icon
          name="phone"
          // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
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
