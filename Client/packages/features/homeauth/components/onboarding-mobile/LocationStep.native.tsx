import React from "react";

import { Box } from "packages/ui/components/primitives/box";
import { Text } from "packages/ui/components/primitives/text";

import { ImportantLocationsInputNative } from "@/features/profile/components/settings/inputs/ImportantLocationsInput.native";
import { type OnboardingData, SECTION_TITLES } from "@/features/profile/utils";

type LocationStepProps = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

export function LocationStep({ formData, updateFormData }: LocationStepProps) {
  const locations = Array.isArray(formData.important_locations) ? formData.important_locations : [];

  return (
    <Box className="gap-5">
      <Text className="text-lg font-semibold text-gray-900">
        {SECTION_TITLES.LOCATION_PREFERENCES}
      </Text>
      <Text className="text-sm text-gray-600">
        Add work, family, or other places you care about. We'll use these to find homes that fit
        your life.
      </Text>

      <ImportantLocationsInputNative
        locations={locations}
        onChange={(next) => updateFormData("important_locations", next)}
        isEditMode
      />
    </Box>
  );
}
