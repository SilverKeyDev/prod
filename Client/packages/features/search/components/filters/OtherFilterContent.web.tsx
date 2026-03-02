import React from "react";

import { Dropdown } from "packages/ui/components/index.web";

import Label from "@/features/profile/components/settings/inputs/Label";
import OptionTagInput from "@/features/profile/components/settings/inputs/OptionTagInput.web";
import OnPerTagInput from "@/features/profile/components/settings/inputs/TagInput.web";
import {
  FIELD_LABELS,
  HOUSING_TYPE_OPTIONS,
  type OnboardingData,
  parseHousingTypes,
  serializeHousingTypes,
} from "@/features/profile/utils";

const LOT_SIZE_OPTIONS = [
  { value: "small", label: "Small (under 0.25 acres)" },
  { value: "medium", label: "Medium (0.25 - 0.5 acres)" },
  { value: "large", label: "Large (0.5 - 1 acre)" },
  { value: "very_large", label: "Very Large (1+ acres)" },
];

const HOME_AGE_OPTIONS = [
  { value: "new", label: "New (0-5 years)" },
  { value: "recent", label: "Recent (5-15 years)" },
  { value: "established", label: "Established (15-30 years)" },
  { value: "mature", label: "Mature (30-50 years)" },
  { value: "historic", label: "Historic (50+ years)" },
];

const ARCHITECTURAL_STYLE_OPTIONS = [
  { value: "modern", label: "Modern" },
  { value: "traditional", label: "Traditional" },
  { value: "colonial", label: "Colonial" },
  { value: "ranch", label: "Ranch" },
  { value: "craftsman", label: "Craftsman" },
  { value: "victorian", label: "Victorian" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "contemporary", label: "Contemporary" },
];

const RENOVATION_OPTIONS = [
  { value: "none", label: "None - Move-in Ready" },
  { value: "minor", label: "Minor Cosmetic Updates" },
  { value: "major", label: "Major Renovations" },
  { value: "complete", label: "Complete Renovation" },
];

const PROPERTY_USE_OPTIONS = [
  { value: "primary", label: "Primary Residence" },
  { value: "investment", label: "Investment Property" },
  { value: "vacation", label: "Vacation Home" },
  { value: "rental", label: "Rental Property" },
  { value: "airbnb", label: "AirBnB" },
];

const WALKABILITY_OPTIONS = [
  { value: "very_important", label: "Very Important" },
  { value: "somewhat_important", label: "Somewhat Important" },
  { value: "not_important", label: "Not Important" },
];

export type OtherFilterContentProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  /** When true, omit the housing type field (e.g. when shown in a separate "Home Type" filter) */
  hideHousingType?: boolean;
};

export default function OtherFilterContent({
  formData,
  updateFormData,
  hideHousingType = false,
}: OtherFilterContentProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {!hideHousingType && (
          <div>
            <Label>{FIELD_LABELS.PREFERRED_HOUSING_TYPE}</Label>
            <OptionTagInput
              options={HOUSING_TYPE_OPTIONS}
              value={parseHousingTypes(formData.preferred_housing_type)}
              onChange={(arr) =>
                updateFormData("preferred_housing_type", serializeHousingTypes(arr))
              }
              isEditMode={true}
            />
          </div>
        )}
        <div>
          <Label>{FIELD_LABELS.PREFERRED_LOT_SIZE}</Label>
          <Dropdown
            value={formData.preferred_lot_size ?? ""}
            onChange={(v) => updateFormData("preferred_lot_size", v)}
            options={LOT_SIZE_OPTIONS}
            placeholder="Select..."
            size="sm"
          />
        </div>
        <div>
          <Label>{FIELD_LABELS.PREFERRED_HOME_AGE}</Label>
          <Dropdown
            value={formData.preferred_home_age ?? ""}
            onChange={(v) => updateFormData("preferred_home_age", v)}
            options={HOME_AGE_OPTIONS}
            placeholder="Select..."
            size="sm"
          />
        </div>
        <div>
          <Label>{FIELD_LABELS.PREFERRED_ARCHITECTURAL_STYLE}</Label>
          <Dropdown
            value={formData.preferred_architectural_style ?? ""}
            onChange={(v) => updateFormData("preferred_architectural_style", v)}
            options={ARCHITECTURAL_STYLE_OPTIONS}
            placeholder="Select..."
            size="sm"
          />
        </div>
        <div>
          <Label>{FIELD_LABELS.RENOVATION_PREFERENCE}</Label>
          <Dropdown
            value={formData.renovation_preference ?? ""}
            onChange={(v) => updateFormData("renovation_preference", v)}
            options={RENOVATION_OPTIONS}
            placeholder="Select..."
            size="sm"
          />
        </div>
        <div>
          <Label>{FIELD_LABELS.INTENDED_PROPERTY_USE}</Label>
          <Dropdown
            value={formData.intended_property_use ?? ""}
            onChange={(v) => updateFormData("intended_property_use", v)}
            options={PROPERTY_USE_OPTIONS}
            placeholder="Select..."
            size="sm"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>{FIELD_LABELS.WALKABILITY_IMPORTANCE}</Label>
          <Dropdown
            value={formData.walkability_importance ?? ""}
            onChange={(v) => updateFormData("walkability_importance", v)}
            options={WALKABILITY_OPTIONS}
            placeholder="Select..."
            size="sm"
          />
        </div>
      </div>

      <div>
        <Label>{FIELD_LABELS.PREFERRED_HOME_FEATURES}</Label>
        <OnPerTagInput
          value={(formData.preferred_home_features as string[]) ?? []}
          onChange={(v: string[]) => updateFormData("preferred_home_features", v)}
          placeholder="e.g., garage, pool, fireplace"
          isEditMode={true}
        />
      </div>
      <div>
        <Label>{FIELD_LABELS.DEAL_BREAKERS}</Label>
        <OnPerTagInput
          value={(formData.deal_breakers as string[]) ?? []}
          onChange={(v: string[]) => updateFormData("deal_breakers", v)}
          placeholder="e.g., No parking, Busy road"
          isEditMode={true}
        />
      </div>
    </div>
  );
}
