/**
 * IpOrgDetailsStep — SIL-193
 * Captures integration partner organization/company details.
 */
import React from "react";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { INTEGRATION_PARTNER_TRANSLATIONS } from "packages/features/integrationPartner/types/translations";
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
        <Box className="flex flex-col gap-1">
          <BodyText size="sm" className="font-medium">Organization name</BodyText>
          <input
            type="text"
            value={formData.ip_org_name ?? ""}
            onChange={(e) => updateFormData("ip_org_name", e.target.value)}
            placeholder="Acme Real Estate Services"
            className="border-border rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </Box>
        <Box className="flex flex-col gap-1">
          <BodyText size="sm" className="font-medium">Website</BodyText>
          <input
            type="url"
            value={formData.ip_website ?? ""}
            onChange={(e) => updateFormData("ip_website", e.target.value)}
            placeholder="https://yourcompany.com"
            className="border-border rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </Box>
      </Box>
    </Box>
  );
}