import React from "react";

import { useLocalization } from "packages/contexts";
import { useSearchContextStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";

import PreferencesSaveStatusRow from "@/features/profile/components/settings/inputs/PreferencesSaveStatusRow";
import type { OnboardingData } from "@/features/profile/utils";

import BedBathFilter from "./BedBathFilter.web";
import OtherFilterDropdown from "./OtherFilterDropdown.web";
import PriceRangeFilter from "./PriceRangeFilter.web";

export type SearchFiltersPanelProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  saveStatus?: "idle" | "saving" | "saved";
};
export default function SearchFiltersPanel({
  formData,
  updateFormData,
  saveStatus = "idle",
}: SearchFiltersPanelProps): React.ReactElement {
  const { t } = useLocalization();
  const setSearchFilterOverrides = useSearchContextStore((s) => s.setSearchFilterOverrides);
  return (
    <Box className="space-y-4 pb-8">
      <PreferencesSaveStatusRow
        saveStatus={saveStatus}
        savingLabel={t("common.saving")}
        savedLabel={t("common.saved")}
        className="flex items-center gap-2 text-sm"
      />

      <PriceRangeFilter
        minValue={formData.home_budget_min ?? 100000}
        maxValue={formData.home_budget_max ?? 2000000}
        onChange={(minVal, maxVal) => {
          updateFormData("home_budget_min", minVal);
          updateFormData("home_budget_max", maxVal);
        }}
      />

      <BedBathFilter
        minBeds={formData.preferred_bedrooms ?? 0}
        maxBeds={formData.preferred_bedrooms_max ?? 8}
        minBaths={formData.preferred_bathrooms ?? 0}
        maxBaths={formData.preferred_bathrooms_max ?? 8}
        onMinBedsChange={(v) => updateFormData("preferred_bedrooms", v)}
        onMaxBedsChange={(v) => {
          updateFormData("preferred_bedrooms_max", v);
          setSearchFilterOverrides((prev) => ({
            ...prev,
            preferred_bedrooms_max: v,
          }));
        }}
        onMinBathsChange={(v) => updateFormData("preferred_bathrooms", v)}
        onMaxBathsChange={(v) => {
          updateFormData("preferred_bathrooms_max", v);
          setSearchFilterOverrides((prev) => ({
            ...prev,
            preferred_bathrooms_max: v,
          }));
        }}
      />

      <OtherFilterDropdown
        formData={formData}
        updateFormData={updateFormData}
        onSearchFilterOverridesPatch={(patch) =>
          setSearchFilterOverrides((prev) => ({ ...prev, ...patch }))
        }
      />
    </Box>
  );
}
