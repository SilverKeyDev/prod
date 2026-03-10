import React from "react";

import BudgetRangeSlider from "packages/features/profile/components/settings/inputs/BudgetRangeSlider";
import PriceRangeSlider from "packages/features/profile/components/settings/inputs/PriceRangeSlider";
import {
  ARCHITECTURAL_STYLE_OPTIONS,
  DAYS_ON_MARKET_TICK_VALUES,
  FIELD_LABELS,
  HOME_AGE_YEARS_TICK_VALUES,
  LOT_SIZE_ACRES_TICK_VALUES,
  type OnboardingData,
  SECTION_TITLES,
  SQFT_TICK_VALUES,
} from "packages/features/profile/utils";
import { PrimitiveInput } from "packages/ui/components/primitives";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

import { ProfileReadOnlyValue } from "./ProfileReadOnlyValue";

type ProfileHousingSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateField: (field: keyof OnboardingData, value: unknown) => void;
};

export function ProfileHousingSection({
  formData,
  isEditMode,
  updateField,
}: ProfileHousingSectionProps) {
  return (
    <Box className="gap-4">
      <Title size="md">{SECTION_TITLES.HOUSING_PREFERENCES}</Title>

      <Box>
        <BodyText size="sm" className="mb-2 font-medium text-gray-700">
          {FIELD_LABELS.SQUARE_FEET}
        </BodyText>
        {isEditMode ? (
          <BudgetRangeSlider
            tickValues={SQFT_TICK_VALUES}
            minValue={formData.preferred_sqft_min ?? SQFT_TICK_VALUES[0]}
            maxValue={formData.preferred_sqft_max ?? SQFT_TICK_VALUES[SQFT_TICK_VALUES.length - 1]}
            onChange={(minVal, maxVal) => {
              updateField("preferred_sqft_min", minVal);
              updateField("preferred_sqft_max", maxVal);
            }}
            formatValue={(v) => `${v.toLocaleString()} sq ft`}
            formatPrefix=""
            minGap={250}
            className="mt-2"
          />
        ) : (
          <Box className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <Text className="text-center text-base text-gray-900">
              {(formData.preferred_sqft_min ?? SQFT_TICK_VALUES[0]).toLocaleString()} –{" "}
              {(
                formData.preferred_sqft_max ?? SQFT_TICK_VALUES[SQFT_TICK_VALUES.length - 1]
              ).toLocaleString()}{" "}
              sq ft
            </Text>
          </Box>
        )}
      </Box>

      <Box>
        <BodyText size="sm" className="mb-2 font-medium text-gray-700">
          {FIELD_LABELS.DAYS_ON_MARKET}
        </BodyText>
        {isEditMode ? (
          <BudgetRangeSlider
            tickValues={DAYS_ON_MARKET_TICK_VALUES}
            minValue={formData.days_on_market_min ?? DAYS_ON_MARKET_TICK_VALUES[0]}
            maxValue={
              formData.days_on_market_max ??
              DAYS_ON_MARKET_TICK_VALUES[DAYS_ON_MARKET_TICK_VALUES.length - 1]
            }
            onChange={(minVal, maxVal) => {
              updateField("days_on_market_min", minVal);
              updateField("days_on_market_max", maxVal);
            }}
            formatValue={(v) => `${v} days`}
            formatPrefix=""
            minGap={7}
            className="mt-2"
          />
        ) : (
          <Box className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <Text className="text-center text-base text-gray-900">
              {formData.days_on_market_min ?? DAYS_ON_MARKET_TICK_VALUES[0]} –{" "}
              {formData.days_on_market_max ??
                DAYS_ON_MARKET_TICK_VALUES[DAYS_ON_MARKET_TICK_VALUES.length - 1]}{" "}
              days
            </Text>
          </Box>
        )}
      </Box>

      <Box>
        <BodyText size="sm" className="mb-2 font-medium text-gray-700">
          {FIELD_LABELS.PREFERRED_BEDROOMS}
        </BodyText>
        {isEditMode ? (
          <PrimitiveInput
            value={formData.preferred_bedrooms?.toString() ?? ""}
            onValueChange={(v) =>
              updateField("preferred_bedrooms", v ? parseInt(v, 10) || undefined : undefined)
            }
            placeholder="Number of bedrooms"
            keyboardType="number-pad"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
          />
        ) : (
          <ProfileReadOnlyValue value={formData.preferred_bedrooms} />
        )}
      </Box>

      <Box>
        <BodyText size="sm" className="mb-2 font-medium text-gray-700">
          {FIELD_LABELS.PREFERRED_LOT_SIZE}
        </BodyText>
        {isEditMode ? (
          <BudgetRangeSlider
            tickValues={LOT_SIZE_ACRES_TICK_VALUES}
            minValue={formData.preferred_lot_size_min ?? LOT_SIZE_ACRES_TICK_VALUES[0]}
            maxValue={
              formData.preferred_lot_size_max ??
              LOT_SIZE_ACRES_TICK_VALUES[LOT_SIZE_ACRES_TICK_VALUES.length - 1]
            }
            onChange={(minVal, maxVal) => {
              updateField("preferred_lot_size_min", minVal);
              updateField("preferred_lot_size_max", maxVal);
            }}
            formatValue={(v) => `${v} ac`}
            formatPrefix=""
            minGap={0.1}
            className="mt-2"
          />
        ) : (
          <Box className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <Text className="text-center text-base text-gray-900">
              {formData.preferred_lot_size_min ?? LOT_SIZE_ACRES_TICK_VALUES[0]} –{" "}
              {formData.preferred_lot_size_max ??
                LOT_SIZE_ACRES_TICK_VALUES[LOT_SIZE_ACRES_TICK_VALUES.length - 1]}{" "}
              acres
            </Text>
          </Box>
        )}
      </Box>

      <Box>
        <BodyText size="sm" className="mb-2 font-medium text-gray-700">
          {FIELD_LABELS.PREFERRED_HOME_AGE}
        </BodyText>
        {isEditMode ? (
          <PriceRangeSlider
            tickValues={HOME_AGE_YEARS_TICK_VALUES}
            value={
              formData.preferred_home_age_max ??
              HOME_AGE_YEARS_TICK_VALUES[HOME_AGE_YEARS_TICK_VALUES.length - 1]
            }
            onChange={(val) => updateField("preferred_home_age_max", val)}
            formatValue={(v) => `${v} years`}
            formatPrefix=""
            className="mt-2"
          />
        ) : (
          <Box className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <Text className="text-center text-base text-gray-900">
              {formData.preferred_home_age_max != null
                ? `Up to ${formData.preferred_home_age_max} years`
                : "Not specified"}
            </Text>
          </Box>
        )}
      </Box>

      <Box>
        <BodyText size="sm" className="mb-2 font-medium text-gray-700">
          {FIELD_LABELS.PREFERRED_BATHROOMS}
        </BodyText>
        {isEditMode ? (
          <PrimitiveInput
            value={formData.preferred_bathrooms?.toString() ?? ""}
            onValueChange={(v) =>
              updateField("preferred_bathrooms", v ? parseInt(v, 10) || undefined : undefined)
            }
            placeholder="Number of bathrooms"
            keyboardType="number-pad"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
          />
        ) : (
          <ProfileReadOnlyValue value={formData.preferred_bathrooms} />
        )}
      </Box>

      <Box>
        <BodyText size="sm" className="mb-2 font-medium text-gray-700">
          {FIELD_LABELS.PREFERRED_ARCHITECTURAL_STYLE}
        </BodyText>
        {isEditMode ? (
          <Box className="flex-row flex-wrap gap-2">
            {ARCHITECTURAL_STYLE_OPTIONS.map((option) => {
              const selected = formData.preferred_architectural_style === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => updateField("preferred_architectural_style", option.value)}
                  className={`rounded-full px-4 py-2 ${
                    selected ? "bg-brand-accent" : "border border-gray-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${selected ? "text-white" : "text-gray-800"}`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </Box>
        ) : (
          <ProfileReadOnlyValue
            value={
              ARCHITECTURAL_STYLE_OPTIONS.find(
                (opt) => opt.value === formData.preferred_architectural_style
              )?.label
            }
          />
        )}
      </Box>
    </Box>
  );
}
