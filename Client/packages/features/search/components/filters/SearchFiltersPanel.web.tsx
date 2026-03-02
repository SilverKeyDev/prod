import React from "react";

import { Check } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { useSearchContextStore } from "packages/store";
import { BodyText } from "packages/ui/components/index.web";

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
    <div className="space-y-4 pb-8">
      {saveStatus !== "idle" && (
        <div className="flex items-center gap-2 text-sm">
          {saveStatus === "saving" && (
            <BodyText as="span" size="sm" muted>
              {t("common.saving")}
            </BodyText>
          )}
          {saveStatus === "saved" && (
            <BodyText as="span" size="sm" className="flex items-center gap-1 text-green-600">
              <Check className="h-4 w-4" />
              {t("search.saved")}
            </BodyText>
          )}
        </div>
      )}

      <PriceRangeFilter
        minValue={formData.home_budget_min ?? 100_000}
        maxValue={formData.home_budget_max ?? 2_000_000}
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

      <OtherFilterDropdown formData={formData} updateFormData={updateFormData} />
    </div>
  );
}
