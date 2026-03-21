import React from "react";

import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

import { ImportantLocationsInput } from "@/features/profile/components/settings/inputs/ImportantLocationsInput";
import {
  AGENT_OPTIONAL_BUYER_LOCATION_PREFERENCES_HINT,
  effectiveIsAgentForOptionalBuyerUi,
  type OnboardingData,
  SECTION_TITLES,
} from "@/features/profile/utils";

type LocationStepProps = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

export function LocationStep({ formData, updateFormData }: LocationStepProps) {
  const authIsAgent = useIsAgent();
  const showAgentOptionalBuyerCallout = effectiveIsAgentForOptionalBuyerUi({
    authIsAgent,
    formIsAgent: formData.is_agent,
  });
  const locations = Array.isArray(formData.important_locations) ? formData.important_locations : [];

  return (
    <Box className="gap-5">
      <Text className="text-text-primary text-lg font-semibold">
        {SECTION_TITLES.LOCATION_PREFERENCES}
      </Text>
      {showAgentOptionalBuyerCallout && (
        <Box className="border-border bg-background-surface rounded-lg border px-3 py-2">
          <Text className="text-text-secondary text-xs">
            {AGENT_OPTIONAL_BUYER_LOCATION_PREFERENCES_HINT}
          </Text>
        </Box>
      )}
      <Text className="text-text-secondary text-sm">
        Add work, family, or other places you care about. We'll use these to find homes that fit
        your life.
      </Text>

      <ImportantLocationsInput
        locations={locations}
        onChange={(next) => updateFormData("important_locations", next)}
        isEditMode
      />
    </Box>
  );
}
