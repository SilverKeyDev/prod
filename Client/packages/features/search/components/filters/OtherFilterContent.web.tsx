import React from "react";

import {
  ARCHITECTURAL_STYLE_OPTIONS,
  HOME_AGE_OPTIONS,
  LOT_SIZE_OPTIONS,
  PROPERTY_USE_OPTIONS,
  RENOVATION_OPTIONS,
  WALKABILITY_OPTIONS,
} from "packages/features/search/types/otherFilterOptions";
import { Box } from "packages/ui/components/primitives";

import { Dropdown } from "@/components/ui";
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
    <Box className="space-y-4">
      <Box className="grid gap-3 sm:grid-cols-2">
        {!hideHousingType && (
          <Box>
            <Label>{FIELD_LABELS.PREFERRED_HOUSING_TYPE}</Label>
            <OptionTagInput
              options={HOUSING_TYPE_OPTIONS}
              value={parseHousingTypes(formData.preferred_housing_type)}
              onChange={(arr) =>
                updateFormData("preferred_housing_type", serializeHousingTypes(arr))
              }
              isEditMode={true}
            />
          </Box>
        )}
        <Box>
          <Label>{FIELD_LABELS.PREFERRED_LOT_SIZE}</Label>
          <Dropdown
            value={formData.preferred_lot_size ?? ""}
            onChange={(v) => updateFormData("preferred_lot_size", v)}
            options={LOT_SIZE_OPTIONS}
            placeholder="Select..."
            size="sm"
          />
        </Box>
        <Box>
          <Label>{FIELD_LABELS.PREFERRED_HOME_AGE}</Label>
          <Dropdown
            value={formData.preferred_home_age ?? ""}
            onChange={(v) => updateFormData("preferred_home_age", v)}
            options={HOME_AGE_OPTIONS}
            placeholder="Select..."
            size="sm"
          />
        </Box>
        <Box>
          <Label>{FIELD_LABELS.PREFERRED_ARCHITECTURAL_STYLE}</Label>
          <Dropdown
            value={formData.preferred_architectural_style ?? ""}
            onChange={(v) => updateFormData("preferred_architectural_style", v)}
            options={ARCHITECTURAL_STYLE_OPTIONS}
            placeholder="Select..."
            size="sm"
          />
        </Box>
        <Box>
          <Label>{FIELD_LABELS.RENOVATION_PREFERENCE}</Label>
          <Dropdown
            value={formData.renovation_preference ?? ""}
            onChange={(v) => updateFormData("renovation_preference", v)}
            options={RENOVATION_OPTIONS}
            placeholder="Select..."
            size="sm"
          />
        </Box>
        <Box>
          <Label>{FIELD_LABELS.INTENDED_PROPERTY_USE}</Label>
          <Dropdown
            value={formData.intended_property_use ?? ""}
            onChange={(v) => updateFormData("intended_property_use", v)}
            options={PROPERTY_USE_OPTIONS}
            placeholder="Select..."
            size="sm"
          />
        </Box>
        <Box className="sm:col-span-2">
          <Label>{FIELD_LABELS.WALKABILITY_IMPORTANCE}</Label>
          <Dropdown
            value={formData.walkability_importance ?? ""}
            onChange={(v) => updateFormData("walkability_importance", v)}
            options={WALKABILITY_OPTIONS}
            placeholder="Select..."
            size="sm"
          />
        </Box>
      </Box>

      <Box>
        <Label>{FIELD_LABELS.PREFERRED_HOME_FEATURES}</Label>
        <OnPerTagInput
          value={(formData.preferred_home_features as string[]) ?? []}
          onChange={(v: string[]) => updateFormData("preferred_home_features", v)}
          placeholder="e.g., garage, pool, fireplace"
          isEditMode={true}
        />
      </Box>
      <Box>
        <Label>{FIELD_LABELS.DEAL_BREAKERS}</Label>
        <OnPerTagInput
          value={(formData.deal_breakers as string[]) ?? []}
          onChange={(v: string[]) => updateFormData("deal_breakers", v)}
          placeholder="e.g., No parking, Busy road"
          isEditMode={true}
        />
      </Box>
    </Box>
  );
}
