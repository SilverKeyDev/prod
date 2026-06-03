import StaticPageLayout, {
  Bold,
  EmailLink,
  List,
  ListItem,
  Paragraph,
  Section,
} from "packages/features/homeauth/components/core/StaticPageLayout.native";
import { LEGAL_PAGES_LAST_UPDATED } from "packages/utils/legal/staticLegalContact";

import { PrivacyPolicyContent } from "./PrivacyPolicyContent";

export function PrivacyPolicyScreenNative() {
  return (
    <StaticPageLayout title="Privacy policy" subtitle={LEGAL_PAGES_LAST_UPDATED}>
      <PrivacyPolicyContent
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
