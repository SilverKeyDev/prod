import React, { useCallback } from "react";

import { SearchPrefsLocation } from "packages/features/profile/components/profileScreen/searchPreferences/SearchPrefsLocation";
import { SearchPrefsNeighborhood } from "packages/features/profile/components/profileScreen/searchPreferences/SearchPrefsNeighborhood";
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile/components/profileScreen/searchPreferences/types";
import { withBuyerExtV1 } from "packages/features/profile/components/profileScreen/searchPreferences/withBuyerExtV1";
import { ImportantLocationsInput } from "packages/features/profile/components/settings/inputs/locations/ImportantLocationsInput";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import {
  AGENT_OPTIONAL_BUYER_LOCATION_PREFERENCES_HINT,
  effectiveIsAgentForOptionalBuyerUi,
  type OnboardingData,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { Box, Text } from "packages/ui/components/primitives";

type LocationStepProps = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
};

export function LocationStep({
  formData,
  updateFormData,
  patchBuyerPreferenceExtensions,
}: LocationStepProps) {
  const authIsAgent = useIsAgent();
  const showAgentOptionalBuyerCallout = effectiveIsAgentForOptionalBuyerUi({
    authIsAgent,
    formIsAgent: formData.is_agent,
  });
  const locations = Array.isArray(formData.important_locations) ? formData.important_locations : [];

  const patch = useCallback(
    (fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions) => {
      patchBuyerPreferenceExtensions(fn);
    },
    [patchBuyerPreferenceExtensions]
  );

  const ext = withBuyerExtV1(formData.buyerPreferenceExtensions);

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
        Add work, family, or other places you care about. We&apos;ll use these to find homes that
        fit your life.
      </Text>

      <ImportantLocationsInput
        locations={locations}
        onChange={(next) => updateFormData("important_locations", next)}
        isEditMode
      />

      <Box className="gap-6">
        <SearchPrefsLocation isEditMode patch={patch} loc={ext.location_prefs ?? {}} />
        <SearchPrefsNeighborhood isEditMode patch={patch} neigh={ext.neighborhood ?? {}} />
      </Box>
    </Box>
  );
}
