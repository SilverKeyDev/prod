import React from "react";

import { Box } from "packages/ui/components/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import BudgetRangeSlider from "@/features/profile/components/settings/inputs/BudgetRangeSlider";
import Label from "@/features/profile/components/settings/inputs/Label";
import {
  DAYS_ON_MARKET_TICK_VALUES,
  FIELD_LABELS,
  HOME_AGE_YEARS_TICK_VALUES,
  LOT_SIZE_ACRES_TICK_VALUES,
  type OnboardingData,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileRangeValueClassName,
  SQFT_TICK_VALUES,
} from "@/features/profile/utils";

type HousingRangeRowsProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

export function HousingRangeRows({
  formData,
  isEditMode,
  updateFormData,
}: HousingRangeRowsProps) {
  return (
    <>
      <AlignedRow
        breakIntoRows="sm"
        gap="lg"
        justify="start"
        items={[
          {
            title: <Label>{FIELD_LABELS.SQUARE_FEET}</Label>,
            content: isEditMode ? (
              <BudgetRangeSlider
                tickValues={SQFT_TICK_VALUES}
                minValue={formData.preferred_sqft_min ?? SQFT_TICK_VALUES[0]}
                maxValue={
                  formData.preferred_sqft_max ??
                  SQFT_TICK_VALUES[SQFT_TICK_VALUES.length - 1]
                }
                onChange={(minVal, maxVal) => {
                  updateFormData("preferred_sqft_min", minVal);
                  updateFormData("preferred_sqft_max", maxVal);
                }}
                formatValue={(v) => `${v.toLocaleString()} sq ft`}
                formatPrefix=""
                minGap={250}
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileRangeValueClassName(
                  formData.preferred_sqft_min,
                  formData.preferred_sqft_max,
                )}`}
              >
                {formData.preferred_sqft_min != null ||
                formData.preferred_sqft_max != null
                  ? `${(
                      formData.preferred_sqft_min ?? SQFT_TICK_VALUES[0]
                    ).toLocaleString()} – ${(
                      formData.preferred_sqft_max ??
                      SQFT_TICK_VALUES[SQFT_TICK_VALUES.length - 1]
                    ).toLocaleString()} sq ft`
                  : PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.DAYS_ON_MARKET}</Label>,
            content: isEditMode ? (
              <BudgetRangeSlider
                tickValues={DAYS_ON_MARKET_TICK_VALUES}
                minValue={
                  formData.days_on_market_min ?? DAYS_ON_MARKET_TICK_VALUES[0]
                }
                maxValue={
                  formData.days_on_market_max ??
                  DAYS_ON_MARKET_TICK_VALUES[
                    DAYS_ON_MARKET_TICK_VALUES.length - 1
                  ]
                }
                onChange={(minVal, maxVal) => {
                  updateFormData("days_on_market_min", minVal);
                  updateFormData("days_on_market_max", maxVal);
                }}
                formatValue={(v) => `${v} days`}
                formatPrefix=""
                minGap={7}
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileRangeValueClassName(
                  formData.days_on_market_min,
                  formData.days_on_market_max,
                )}`}
              >
                {formData.days_on_market_min != null ||
                formData.days_on_market_max != null
                  ? `${
                      formData.days_on_market_min ??
                      DAYS_ON_MARKET_TICK_VALUES[0]
                    } – ${
                      formData.days_on_market_max ??
                      DAYS_ON_MARKET_TICK_VALUES[
                        DAYS_ON_MARKET_TICK_VALUES.length - 1
                      ]
                    } days`
                  : PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
        ]}
      />

      <AlignedRow
        breakIntoRows="sm"
        gap="lg"
        justify="start"
        items={[
          {
            title: <Label>{FIELD_LABELS.PREFERRED_LOT_SIZE}</Label>,
            content: isEditMode ? (
              <BudgetRangeSlider
                tickValues={LOT_SIZE_ACRES_TICK_VALUES}
                minValue={
                  formData.preferred_lot_size_min ??
                  LOT_SIZE_ACRES_TICK_VALUES[0]
                }
                maxValue={
                  formData.preferred_lot_size_max ??
                  LOT_SIZE_ACRES_TICK_VALUES[
                    LOT_SIZE_ACRES_TICK_VALUES.length - 1
                  ]
                }
                onChange={(minVal, maxVal) => {
                  updateFormData("preferred_lot_size_min", minVal);
                  updateFormData("preferred_lot_size_max", maxVal);
                }}
                formatValue={(v) => `${Number(v).toFixed(2)} ac`}
                formatPrefix=""
                minGap={0.1}
                valueDecimals={2}
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileRangeValueClassName(
                  formData.preferred_lot_size_min,
                  formData.preferred_lot_size_max,
                )}`}
              >
                {formData.preferred_lot_size_min != null ||
                formData.preferred_lot_size_max != null
                  ? `${(
                      formData.preferred_lot_size_min ??
                      LOT_SIZE_ACRES_TICK_VALUES[0]
                    ).toFixed(2)} – ${(
                      formData.preferred_lot_size_max ??
                      LOT_SIZE_ACRES_TICK_VALUES[
                        LOT_SIZE_ACRES_TICK_VALUES.length - 1
                      ]
                    ).toFixed(2)} acres`
                  : PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.PREFERRED_HOME_AGE}</Label>,
            content: isEditMode ? (
              <BudgetRangeSlider
                tickValues={HOME_AGE_YEARS_TICK_VALUES}
                minValue={
                  formData.preferred_home_age_min ??
                  HOME_AGE_YEARS_TICK_VALUES[0]
                }
                maxValue={
                  formData.preferred_home_age_max ??
                  HOME_AGE_YEARS_TICK_VALUES[
                    HOME_AGE_YEARS_TICK_VALUES.length - 1
                  ]
                }
                onChange={(minVal, maxVal) => {
                  updateFormData("preferred_home_age_min", minVal);
                  updateFormData("preferred_home_age_max", maxVal);
                }}
                formatValue={(v) => `${v} years`}
                formatPrefix=""
                minGap={5}
              />
            ) : (
              <Box
                className={`mobile-input bg-background-base ${profileRangeValueClassName(
                  formData.preferred_home_age_min,
                  formData.preferred_home_age_max,
                )}`}
              >
                {formData.preferred_home_age_min != null ||
                formData.preferred_home_age_max != null
                  ? `${
                      formData.preferred_home_age_min ??
                      HOME_AGE_YEARS_TICK_VALUES[0]
                    } – ${
                      formData.preferred_home_age_max ??
                      HOME_AGE_YEARS_TICK_VALUES[
                        HOME_AGE_YEARS_TICK_VALUES.length - 1
                      ]
                    } years`
                  : PROFILE_NOT_SPECIFIED_LABEL}
              </Box>
            ),
          },
        ]}
      />
    </>
  );
}
