/**
 * IpPointOfContactStep — SIL-193
 * Captures the integration partner's primary point of contact.
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

export function IpPointOfContactStep({ formData, updateFormData }: Props) {
  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {INTEGRATION_PARTNER_TRANSLATIONS.IP_CONTACT_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {INTEGRATION_PARTNER_TRANSLATIONS.IP_CONTACT_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="flex flex-col gap-4">
        <Box className="flex flex-col gap-1">
          <BodyText size="sm" className="font-medium">Full name</BodyText>
          <input
            type="text"
            value={formData.ip_contact_name ?? ""}
            onChange={(e) => updateFormData("ip_contact_name", e.target.value)}
            placeholder="Jane Smith"
            className="border-border rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </Box>
        <Box className="flex flex-col gap-1">
          <BodyText size="sm" className="font-medium">Email</BodyText>
          <input
            type="email"
            value={formData.ip_contact_email ?? ""}
            onChange={(e) => updateFormData("ip_contact_email", e.target.value)}
            placeholder="jane@yourcompany.com"
            className="border-border rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </Box>
        <Box className="flex flex-col gap-1">
          <BodyText size="sm" className="font-medium">Phone</BodyText>
          <input
            type="tel"
            value={formData.ip_contact_phone ?? ""}
            onChange={(e) => updateFormData("ip_contact_phone", e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="border-border rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </Box>
      </Box>
    </Box>
  );
}