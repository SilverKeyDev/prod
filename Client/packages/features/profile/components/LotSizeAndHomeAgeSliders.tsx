import React from "react";

import Label from "packages/features/profile/components/settings/inputs/Label";
import BudgetRangeSlider from "packages/features/profile/components/settings/inputs/sliders/BudgetRangeSlider";
import {
  FIELD_LABELS,
  HOME_AGE_YEARS_TICK_VALUES,
  LOT_SIZE_ACRES_TICK_VALUES,
} from "packages/features/profile/utils/public/constants";
import { Box } from "packages/ui/components/structure/primitives";

export type LotSizeHomeAgeFormSlice = {
  preferred_lot_size_min?: number;
  preferred_lot_size_max?: number;
  preferred_home_age_min?: number;
  preferred_home_age_max?: number;
};

/** Keys merged into polygon search filter overrides (non-persisted). */
export type LotSizeHomeAgeSearchOverridesPatch = {
  preferred_lot_size_min?: number;
  preferred_lot_size_max?: number;
  preferred_home_age_min?: number;
  preferred_home_age_max?: number;
};

type LotSizeAndHomeAgeSlidersProps = {
  formData: LotSizeHomeAgeFormSlice;
  updateFormData: (
    field: keyof LotSizeHomeAgeFormSlice | "preferred_lot_size" | "preferred_home_age",
    value: unknown
  ) => void;
  onSearchFilterOverridesPatch?: (patch: LotSizeHomeAgeSearchOverridesPatch) => void;
  className?: string;
};

/**
 * Lot size (acres) and home age (years) range sliders (profile, search filters, onboarding).
 * Clears legacy categorical `preferred_lot_size` / `preferred_home_age` when ranges change.
 */
export function LotSizeAndHomeAgeSliders({
  formData,
  updateFormData,
  onSearchFilterOverridesPatch,
  className = "",
}: LotSizeAndHomeAgeSlidersProps): React.ReactElement {
  return (
    <>
      <Box className={className}>
        <Label>{FIELD_LABELS.PREFERRED_LOT_SIZE}</Label>
        <BudgetRangeSlider
          tickValues={LOT_SIZE_ACRES_TICK_VALUES}
          minValue={formData.preferred_lot_size_min ?? LOT_SIZE_ACRES_TICK_VALUES[0]}
          maxValue={
            formData.preferred_lot_size_max ??
            LOT_SIZE_ACRES_TICK_VALUES[LOT_SIZE_ACRES_TICK_VALUES.length - 1]
          }
          onChange={(minVal, maxVal) => {
            updateFormData("preferred_lot_size_min", minVal);
            updateFormData("preferred_lot_size_max", maxVal);
            updateFormData("preferred_lot_size", undefined);
            onSearchFilterOverridesPatch?.({
              preferred_lot_size_min: minVal,
              preferred_lot_size_max: maxVal,
            });
          }}
          formatValue={(v) => `${Number(v).toFixed(2)} ac`}
          formatPrefix=""
          minGap={0.1}
          valueDecimals={2}
          className="mt-2"
        />
      </Box>
      <Box className={className}>
        <Label>{FIELD_LABELS.PREFERRED_HOME_AGE}</Label>
        <BudgetRangeSlider
          tickValues={HOME_AGE_YEARS_TICK_VALUES}
          minValue={formData.preferred_home_age_min ?? HOME_AGE_YEARS_TICK_VALUES[0]}
          maxValue={
            formData.preferred_home_age_max ??
            HOME_AGE_YEARS_TICK_VALUES[HOME_AGE_YEARS_TICK_VALUES.length - 1]
          }
          onChange={(minVal, maxVal) => {
            updateFormData("preferred_home_age_min", minVal);
            updateFormData("preferred_home_age_max", maxVal);
            updateFormData("preferred_home_age", undefined);
            onSearchFilterOverridesPatch?.({
              preferred_home_age_min: minVal,
              preferred_home_age_max: maxVal,
            });
          }}
          formatValue={(v) => `${v} years`}
          formatPrefix=""
          minGap={5}
          className="mt-2"
        />
      </Box>
    </>
  );
}
