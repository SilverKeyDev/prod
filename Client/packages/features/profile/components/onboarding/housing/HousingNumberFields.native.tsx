import React from "react";

import {
  BATHROOMS_TICK_VALUES,
  BEDROOMS_TICK_VALUES,
  FIELD_LABELS,
  type OnboardingData,
} from "packages/features/profile/utils";
import { BudgetRangeSlider } from "packages/ui";
import { ResponsiveEqualColumns } from "packages/ui/components/structure/layout";
import { Box } from "packages/ui/components/structure/primitives";
import { Text } from "packages/ui/components/structure/primitives";

export function HousingNumberFields({
  formData,
  updateFormData,
}: {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
}) {
  return (
    <ResponsiveEqualColumns>
      <Box>
        <Text className="text-text-secondary mb-2 text-sm font-medium">
          {FIELD_LABELS.PREFERRED_BEDROOMS}
        </Text>
        <BudgetRangeSlider
          tickValues={BEDROOMS_TICK_VALUES}
          minValue={formData.preferred_bedrooms_min ?? BEDROOMS_TICK_VALUES[0]}
          maxValue={
            formData.preferred_bedrooms_max ?? BEDROOMS_TICK_VALUES[BEDROOMS_TICK_VALUES.length - 1]
          }
          onChange={(minVal, maxVal) => {
            updateFormData("preferred_bedrooms_min", minVal);
            updateFormData("preferred_bedrooms_max", maxVal);
          }}
          formatValue={(v) => `${v} bed${v !== 1 ? "s" : ""}`}
          formatPrefix=""
          allowSingleValue
        />
      </Box>
      <Box>
        <Text className="text-text-secondary mb-2 text-sm font-medium">
          {FIELD_LABELS.PREFERRED_BATHROOMS}
        </Text>
        <BudgetRangeSlider
          tickValues={BATHROOMS_TICK_VALUES}
          minValue={formData.preferred_bathrooms_min ?? BATHROOMS_TICK_VALUES[0]}
          maxValue={
            formData.preferred_bathrooms_max ??
            BATHROOMS_TICK_VALUES[BATHROOMS_TICK_VALUES.length - 1]
          }
          onChange={(minVal, maxVal) => {
            updateFormData("preferred_bathrooms_min", minVal);
            updateFormData("preferred_bathrooms_max", maxVal);
          }}
          formatValue={(v) => `${v} bath${v !== 1 ? "s" : ""}`}
          formatPrefix=""
          allowSingleValue
        />
      </Box>
    </ResponsiveEqualColumns>
  );
}
