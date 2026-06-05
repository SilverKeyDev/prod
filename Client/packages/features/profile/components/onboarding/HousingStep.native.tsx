import React from "react";

import type { PatchBuyerPreferenceExtensions } from "packages/features/profile/components/profileScreen/searchPreferences/types";
import { ProfileSearchPropertySection } from "packages/features/profile/components/profileScreen/sections/search/ProfileSearchPropertySection";
import { type OnboardingData } from "packages/features/profile/utils";
import { Box } from "packages/ui/components/structure/primitives";

import { HousingStepEssentials } from "./housing/HousingStepEssentials.native";
import { HousingStepRanges } from "./housing/HousingStepRanges.native";

/**
 * Full housing + features form in one scroll (e.g. Define Criteria). Onboarding uses split steps instead.
 */
export function HousingStep({
  formData,
  updateFormData,
  patchBuyerPreferenceExtensions,
}: {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
}) {
  return (
    <Box className="gap-10">
      <HousingStepEssentials formData={formData} updateFormData={updateFormData} />
      <HousingStepRanges formData={formData} updateFormData={updateFormData} />
      <ProfileSearchPropertySection
        formData={formData}
        isEditMode
        updateField={(field, value) => updateFormData(field, value)}
        patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
      />
    </Box>
  );
}
