import React from "react";

import { Dropdown, Input } from "packages/ui/components/index.web";

import AlignedRow from "@/components/layout/AlignedRow";
import BudgetRangeSlider from "@/features/profile/components/settings/inputs/BudgetRangeSlider.web";
import Label from "@/features/profile/components/settings/inputs/Label";
import PriceRangeSlider from "@/features/profile/components/settings/inputs/PriceRangeSlider";
import {
  ARCHITECTURAL_STYLE_OPTIONS,
  DAYS_ON_MARKET_TICK_VALUES,
  FIELD_LABELS,
  HOME_AGE_YEARS_TICK_VALUES,
  LOT_SIZE_ACRES_TICK_VALUES,
  type OnboardingData,
  SQFT_TICK_VALUES,
} from "@/features/profile/utils";

type HousingRangeRowsProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

export function HousingRangeRows({ formData, isEditMode, updateFormData }: HousingRangeRowsProps) {
  return (
    <>
      <AlignedRow
        breakIntoRows="md"
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
                  formData.preferred_sqft_max ?? SQFT_TICK_VALUES[SQFT_TICK_VALUES.length - 1]
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
              <div className="mobile-input bg-gray-50">
                {formData.preferred_sqft_min != null || formData.preferred_sqft_max != null
                  ? `${(formData.preferred_sqft_min ?? SQFT_TICK_VALUES[0]).toLocaleString()} – ${(formData.preferred_sqft_max ?? SQFT_TICK_VALUES[SQFT_TICK_VALUES.length - 1]).toLocaleString()} sq ft`
                  : "Not specified"}
              </div>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.DAYS_ON_MARKET}</Label>,
            content: isEditMode ? (
              <BudgetRangeSlider
                tickValues={DAYS_ON_MARKET_TICK_VALUES}
                minValue={formData.days_on_market_min ?? DAYS_ON_MARKET_TICK_VALUES[0]}
                maxValue={
                  formData.days_on_market_max ??
                  DAYS_ON_MARKET_TICK_VALUES[DAYS_ON_MARKET_TICK_VALUES.length - 1]
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
              <div className="mobile-input bg-gray-50">
                {formData.days_on_market_min != null || formData.days_on_market_max != null
                  ? `${formData.days_on_market_min ?? DAYS_ON_MARKET_TICK_VALUES[0]} – ${formData.days_on_market_max ?? DAYS_ON_MARKET_TICK_VALUES[DAYS_ON_MARKET_TICK_VALUES.length - 1]} days`
                  : "Not specified"}
              </div>
            ),
          },
        ]}
      />

      <AlignedRow
        breakIntoRows="md"
        gap="lg"
        justify="start"
        items={[
          {
            title: <Label>{FIELD_LABELS.PREFERRED_BATHROOMS}</Label>,
            content: isEditMode ? (
              <Input
                type="number"
                value={formData.preferred_bathrooms?.toString() ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFormData("preferred_bathrooms", parseInt(e.target.value) || undefined)
                }
                placeholder="Number of bathrooms"
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.preferred_bathrooms ?? "Not specified"}
              </div>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.PREFERRED_LOT_SIZE}</Label>,
            content: isEditMode ? (
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
                }}
                formatValue={(v) => `${v} ac`}
                formatPrefix=""
                minGap={0.1}
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.preferred_lot_size_min != null || formData.preferred_lot_size_max != null
                  ? `${formData.preferred_lot_size_min ?? LOT_SIZE_ACRES_TICK_VALUES[0]} – ${formData.preferred_lot_size_max ?? LOT_SIZE_ACRES_TICK_VALUES[LOT_SIZE_ACRES_TICK_VALUES.length - 1]} acres`
                  : "Not specified"}
              </div>
            ),
          },
        ]}
      />

      <AlignedRow
        breakIntoRows="md"
        gap="lg"
        justify="start"
        items={[
          {
            title: <Label>{FIELD_LABELS.PREFERRED_HOME_AGE}</Label>,
            content: isEditMode ? (
              <PriceRangeSlider
                tickValues={HOME_AGE_YEARS_TICK_VALUES}
                value={
                  formData.preferred_home_age_max ??
                  HOME_AGE_YEARS_TICK_VALUES[HOME_AGE_YEARS_TICK_VALUES.length - 1]
                }
                onChange={(val) => updateFormData("preferred_home_age_max", val)}
                formatValue={(v) => `${v} years`}
                formatPrefix=""
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.preferred_home_age_max != null
                  ? `Up to ${formData.preferred_home_age_max} years`
                  : "Not specified"}
              </div>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.PREFERRED_ARCHITECTURAL_STYLE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={formData.preferred_architectural_style ?? ""}
                onChange={(value) => updateFormData("preferred_architectural_style", value)}
                options={ARCHITECTURAL_STYLE_OPTIONS}
                placeholder="Select..."
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.preferred_architectural_style
                  ? ARCHITECTURAL_STYLE_OPTIONS.find(
                      (opt) => opt.value === formData.preferred_architectural_style
                    )?.label
                  : "Not specified"}
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
