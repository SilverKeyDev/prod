import StaticPageLayout, {
  Bold,
  EmailLink,
  List,
  ListItem,
  Paragraph,
  Section,
} from "packages/features/homeauth/components/core/StaticPageLayout.native";

import { PrivacyPolicyContent } from "./PrivacyPolicyContent";

export function PrivacyPolicyScreenNative() {
  return (
    <StaticPageLayout title="Privacy Policy" subtitle="Last updated: 8/27/2025">
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
