import React from "react";

import { ProfileSearchPropertySection } from "packages/features/profile/components/profileScreen/ProfileSearchPropertySection"; // eslint-disable-line silverkey/no-cross-feature-internals -- Define Criteria parity: merged features block matches web ProfileSearchPropertySection
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile/components/profileScreen/searchPreferences/types"; // eslint-disable-line silverkey/no-cross-feature-internals
import { type OnboardingData } from "packages/features/profile/utils"; // eslint-disable-line silverkey/no-cross-feature-internals
import { Box } from "packages/ui/components/primitives";

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
      <HousingStepEssentials
        formData={formData}
        updateFormData={updateFormData}
      />
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
