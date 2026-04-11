import React from "react";

import { useLocalization } from "packages/contexts";
import {
  LocationSection,
  type PatchBuyerPreferenceExtensions,
  ProfileHousingEssentialsSection,
  ProfileHousingRangesSection,
  ProfileSearchPropertySection,
} from "packages/features/profile";
import { Box } from "packages/ui/components/primitives";

import PreferencesSaveStatusRow from "@/features/profile/components/settings/inputs/PreferencesSaveStatusRow";
import type { OnboardingData } from "@/features/profile/utils";

import PriceRangeFilter from "./PriceRangeFilter.web";

export type SearchPreferencesContentProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  saveStatus?: "idle" | "saving" | "saved";
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
  scriptsReady: boolean;
};

export default function SearchPreferencesContent({
  formData,
  updateFormData,
  saveStatus = "idle",
  patchBuyerPreferenceExtensions,
  scriptsReady,
}: SearchPreferencesContentProps): React.ReactElement {
  const { t } = useLocalization();
  const typedFormData = formData as OnboardingData;

  return (
    <Box className="space-y-6">
      <PreferencesSaveStatusRow
        saveStatus={saveStatus}
        savingLabel={t("common.saving")}
        savedLabel={t("common.saved")}
        className="flex items-center gap-2 text-sm"
      />

      <PriceRangeFilter
        minValue={formData.home_budget_min ?? 100_000}
        maxValue={formData.home_budget_max ?? 2_000_000}
        onChange={(minVal, maxVal) => {
          updateFormData("home_budget_min", minVal);
          updateFormData("home_budget_max", maxVal);
        }}
      />

      <ProfileHousingEssentialsSection
        formData={typedFormData}
        isEditMode={true}
        updateField={updateFormData}
      />

      <ProfileHousingRangesSection
        formData={typedFormData}
        isEditMode={true}
        updateField={updateFormData}
      />

      <LocationSection
        formData={typedFormData}
        isEditMode={true}
        updateFormData={updateFormData}
        scriptsReady={scriptsReady}
        patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
      />

      <ProfileSearchPropertySection
        formData={typedFormData}
        isEditMode={true}
        updateField={updateFormData}
        patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
      />
    </Box>
  );
}
