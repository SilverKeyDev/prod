import React from "react";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type MlsListingComplianceFooterProps = {
  className?: string;
};

/**
 * Standard IDX-style notices for listings sourced from MLS feeds.
 * Copy is informational; boards may supply override text via i18n later.
 */
export function MlsListingComplianceFooter({ className = "" }: MlsListingComplianceFooterProps) {
  const { t } = useLocalization();
  const noticeHeading = t("property_details.mls_footer_aria", {
    defaultValue: "Listing data notice",
  });

  return (
    <Box className={`border-border mt-8 border-t pt-6 ${className}`.trim()} role="note">
      <Title as="h3" size="sm" className="text-text-primary mb-2 font-medium">
        {noticeHeading}
      </Title>
      <BodyText as="p" size="xs" className="text-text-secondary leading-relaxed">
        {t("property_details.mls_disclaimer_primary", {
          defaultValue:
            "Listing information is deemed reliable but is not guaranteed and should be independently verified. Confirm school districts, taxes, HOA fees, and all listing details with your real estate professional.",
        })}
      </BodyText>
      <BodyText as="p" size="xs" className="text-text-secondary mt-3 leading-relaxed">
        {t("property_details.mls_disclaimer_secondary", {
          defaultValue:
            "Estimated payments, carrying costs, and third-party valuations (including Zestimate®) are not provided by the listing broker, are for personal reference only, and are not a loan commitment or appraisal.",
        })}
      </BodyText>
    </Box>
  );
}
