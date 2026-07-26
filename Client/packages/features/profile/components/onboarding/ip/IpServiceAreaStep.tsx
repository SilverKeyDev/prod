/**
 * IpServiceAreaStep — SIL-193
 * Captures the states/markets the integration partner serves.
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

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export function IpServiceAreaStep({ formData, updateFormData }: Props) {
  const selected: string[] = (formData.ip_service_states as string[] | undefined) ?? [];

  function toggleState(state: string) {
    const next = selected.includes(state)
      ? selected.filter((s) => s !== state)
      : [...selected, state];
    updateFormData("ip_service_states", next);
  }

  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Title size="md" as="h2">
          {INTEGRATION_PARTNER_TRANSLATIONS.IP_SERVICE_AREA_TITLE}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {INTEGRATION_PARTNER_TRANSLATIONS.IP_SERVICE_AREA_SUBTITLE}
        </BodyText>
      </Box>
      <Box className="flex flex-wrap gap-2">
        {US_STATES.map((state) => (
          <button
            key={state}
            type="button"
            onClick={() => toggleState(state)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              selected.includes(state)
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            {state}
          </button>
        ))}
      </Box>
      {selected.length > 0 && (
        <BodyText size="xs" muted>
          {selected.length} state{selected.length !== 1 ? "s" : ""} selected
        </BodyText>
      )}
    </Box>
  );
}