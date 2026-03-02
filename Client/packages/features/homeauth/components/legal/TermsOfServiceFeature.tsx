import StaticPageLayout, {
  Bold,
  EmailLink,
  List,
  ListItem,
  Paragraph,
  Section,
} from "packages/features/homeauth/components/core/StaticPageLayout";

import { TermsOfServiceContent } from "./TermsOfServiceContent";

export function TermsOfServiceFeature() {
  return (
    <StaticPageLayout title="Terms of Service" subtitle="Last updated: 8/27/2025">
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
