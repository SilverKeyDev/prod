import StaticPageLayout, {
  Bold,
  EmailLink,
  List,
  ListItem,
  Paragraph,
  Section,
} from "packages/features/homeauth/components/core/StaticPageLayout.native";
import { LEGAL_PAGES_LAST_UPDATED } from "packages/utils/transaction/legal/staticLegalContact";

import { TermsOfServiceContent } from "./TermsOfServiceContent";

export function TermsOfServiceScreenNative() {
  return (
    <StaticPageLayout title="Terms of service" subtitle={LEGAL_PAGES_LAST_UPDATED}>
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
