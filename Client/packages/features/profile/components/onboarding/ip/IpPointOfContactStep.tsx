/**
 * IpPointOfContactStep — SIL-193
 * Captures the integration partner's primary point of contact.
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
        {/* `type` is honoured on both platforms: the web Input passes it through to <input>, and
            the native Input maps it to the matching TextInput keyboard. */}
        <Input
          label="Full name"
          type="text"
          value={formData.ip_contact_name ?? ""}
          onValueChange={(text) => updateFormData("ip_contact_name", text)}
          placeholder="Jane Smith"
        />
        <Input
          label="Email"
          type="email"
          value={formData.ip_contact_email ?? ""}
          onValueChange={(text) => updateFormData("ip_contact_email", text)}
          placeholder="jane@yourcompany.com"
        />
        <Input
          label="Phone"
          type="tel"
          value={formData.ip_contact_phone ?? ""}
          onValueChange={(text) => updateFormData("ip_contact_phone", text)}
          placeholder="+1 (555) 000-0000"
        />
      </Box>
    </Box>
  );
}
