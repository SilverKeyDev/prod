import StaticPageLayout, {
  Bold,
  EmailLink,
  List,
  ListItem,
  Paragraph,
  Section,
} from "packages/features/homeauth/components/core/StaticPageLayout";
import { LEGAL_PAGES_LAST_UPDATED } from "packages/utils/legal/staticLegalContact";

import { TermsOfServiceContent } from "./TermsOfServiceContent";

export function TermsOfServiceFeature() {
  return (
    <StaticPageLayout
      title="Terms of service"
      subtitle={LEGAL_PAGES_LAST_UPDATED}
      legalSuiteActive="terms"
    >
      <TermsOfServiceContent
        Section={Section}
        Paragraph={Paragraph}
        List={List}
        ListItem={ListItem}
        Bold={Bold}
        EmailLink={EmailLink}
      />
    </StaticPageLayout>
  );
}
