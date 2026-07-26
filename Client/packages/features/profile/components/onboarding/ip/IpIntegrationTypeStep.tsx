/**
 * IpIntegrationTypeStep — SIL-193
 * Captures the type of integration the partner provides.
 */
import React from "react";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { INTEGRATION_PARTNER_TRANSLATIONS } from "packages/features/integrationPartner/types/translations";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type Props = {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

const INTEGRATION_TYPES = [
  { value: "title", label: "Title Insurance" },
  { value: "lending", label: "Lending / Mortgage" },
  { value: "escrow", label: "Escrow" },
  { value: "home_warranty", label: "Home Warranty" },
  { value: "homeowners_insurance", label: "Homeowners Insurance" },
  { value: "move_concierge", label: "Move Concierge" },
  { value: "other", label: "Other" },
] as const;

export function IpIntegrationTypeStep({ formData, updateFormData }: Props) {
  const selected = formData.ip_integration_type ?? "";
  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {INTEGRATION_PARTNER_TRANSLATIONS.IP_INTEGRATION_TYPE_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {INTEGRATION_PARTNER_TRANSLATIONS.IP_INTEGRATION_TYPE_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="grid gap-3 sm:grid-cols-2">
        {INTEGRATION_TYPES.map((it) => (
          <Button
            key={it.value}
            type="button"
            variant="outline"
            size="sm"
            contentAlign="start"
            label={it.label}
            onClick={() => updateFormData("ip_integration_type", it.value)}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
              selected === it.value
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <Button.Label
              variant="outline"
              size="sm"
              className={selected === it.value ? "text-white" : "text-gray-700"}
            >
              {it.label}
            </Button.Label>
          </Button>
        ))}
      </Box>
    </Box>
  );
}