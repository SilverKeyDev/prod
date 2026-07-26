/**
 * IpOrgDetailsStep — SIL-193
 * Captures integration partner organization/company details.
 */
import React from "react";

import { INTEGRATION_PARTNER_TRANSLATIONS } from "packages/features/integrationPartner/types/translations";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { Input } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type Props = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

export function IpOrgDetailsStep({ formData, updateFormData }: Props) {
  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {INTEGRATION_PARTNER_TRANSLATIONS.IP_ORG_DETAILS_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {INTEGRATION_PARTNER_TRANSLATIONS.IP_ORG_DETAILS_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="flex flex-col gap-4">
        {/* The form Input renders its own visible label and wires it up for accessibility, so no
            separate label element is needed (a second one would read out twice). */}
        <Input
          label="Organization name"
          type="text"
          value={formData.ip_org_name ?? ""}
          onValueChange={(text) => updateFormData("ip_org_name", text)}
          placeholder="Acme Real Estate Services"
        />
        <Input
          label="Website"
          type="url"
          value={formData.ip_website ?? ""}
          onValueChange={(text) => updateFormData("ip_website", text)}
          placeholder="https://yourcompany.com"
        />
      </Box>
    </Box>
  );
}
