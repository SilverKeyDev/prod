import React from "react";

import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Input } from "packages/ui/components/primitives/input";
import { Text } from "packages/ui/components/primitives/text";

import {
  FIELD_LABELS,
  HOUSING_TYPE_OPTIONS,
  INTENDED_USE_OPTIONS,
  MUST_HAVE_OPTIONS,
  type OnboardingData,
  parseHousingTypes,
  RENOVATION_OPTIONS,
  SECTION_TITLES,
  serializeHousingTypes,
  WALKABILITY_OPTIONS,
} from "@/features/profile/utils";

type HousingStepProps = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

export function HousingStep({ formData, updateFormData }: HousingStepProps) {
  const housingTypes = parseHousingTypes(formData.preferred_housing_type ?? "");
  const mustHave = Array.isArray(formData.must_have) ? formData.must_have : [];

  const toggleHousingType = (value: string) => {
    const exists = housingTypes.includes(value);
    const next = exists ? housingTypes.filter((v) => v !== value) : [...housingTypes, value];
    updateFormData("preferred_housing_type", serializeHousingTypes(next));
  };

  const toggleMustHave = (value: string) => {
    const exists = mustHave.includes(value);
    const next = exists ? mustHave.filter((v) => v !== value) : [...mustHave, value];
    updateFormData("must_have", next);
  };

  return (
    <Box className="gap-6">
      <Text className="text-lg font-semibold text-gray-900">
        {SECTION_TITLES.HOUSING_PREFERENCES}
      </Text>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.PREFERRED_BEDROOMS}
        </Text>
        <Input
          value={formData.preferred_bedrooms?.toString() ?? ""}
          onValueChange={(v) =>
            updateFormData("preferred_bedrooms", v ? parseInt(v, 10) : undefined)
          }
          placeholder="e.g. 3"
          keyboardType="number-pad"
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
        />
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.PREFERRED_BATHROOMS}
        </Text>
        <Input
          value={formData.preferred_bathrooms?.toString() ?? ""}
          onValueChange={(v) =>
            updateFormData("preferred_bathrooms", v ? parseInt(v, 10) : undefined)
          }
          placeholder="e.g. 2"
          keyboardType="number-pad"
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
        />
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.PREFERRED_HOUSING_TYPE}
        </Text>
        <Text className="mb-3 text-xs text-gray-500">
          Pick one or more home types you&apos;re open to.
        </Text>
        <Box className="flex flex-row flex-wrap gap-2">
          {HOUSING_TYPE_OPTIONS.map((option) => {
            const selected = housingTypes.includes(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => toggleHousingType(option.value)}
                className={`rounded-full border px-4 py-2 ${
                  selected ? "border-brand-accent bg-brand-accent/10" : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    selected ? "text-brand-accent" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">{FIELD_LABELS.SQUARE_FEET}</Text>
        <Text className="mb-3 text-xs text-gray-500">
          Roughly how big do you want your home to be?
        </Text>
        <Box className="flex flex-row gap-3">
          <Box className="flex-1">
            <Text className="mb-1 text-xs font-medium text-gray-600">Min</Text>
            <Input
              value={formData.preferred_sqft_min?.toString() ?? ""}
              onValueChange={(v) =>
                updateFormData("preferred_sqft_min", v ? parseInt(v, 10) : undefined)
              }
              placeholder="e.g. 1200"
              keyboardType="number-pad"
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
            />
          </Box>
          <Box className="flex-1">
            <Text className="mb-1 text-xs font-medium text-gray-600">Max</Text>
            <Input
              value={formData.preferred_sqft_max?.toString() ?? ""}
              onValueChange={(v) =>
                updateFormData("preferred_sqft_max", v ? parseInt(v, 10) : undefined)
              }
              placeholder="e.g. 2500"
              keyboardType="number-pad"
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
            />
          </Box>
        </Box>
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.PREFERRED_LOT_SIZE}
        </Text>
        <Text className="mb-3 text-xs text-gray-500">
          If yard size matters, set a rough range in acres.
        </Text>
        <Box className="flex flex-row gap-3">
          <Box className="flex-1">
            <Text className="mb-1 text-xs font-medium text-gray-600">Min (acres)</Text>
            <Input
              value={formData.preferred_lot_size_min?.toString() ?? ""}
              onValueChange={(v) =>
                updateFormData(
                  "preferred_lot_size_min",
                  v && v.trim() !== "" ? Number.parseFloat(v) || undefined : undefined
                )
              }
              placeholder="e.g. 0.25"
              keyboardType="decimal-pad"
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
            />
          </Box>
          <Box className="flex-1">
            <Text className="mb-1 text-xs font-medium text-gray-600">Max (acres)</Text>
            <Input
              value={formData.preferred_lot_size_max?.toString() ?? ""}
              onValueChange={(v) =>
                updateFormData(
                  "preferred_lot_size_max",
                  v && v.trim() !== "" ? Number.parseFloat(v) || undefined : undefined
                )
              }
              placeholder="e.g. 1"
              keyboardType="decimal-pad"
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
            />
          </Box>
        </Box>
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.PREFERRED_HOME_AGE}
        </Text>
        <Text className="mb-3 text-xs text-gray-500">
          How old is too old? We&apos;ll prioritize homes newer than this.
        </Text>
        <Input
          value={formData.preferred_home_age_max?.toString() ?? ""}
          onValueChange={(v) =>
            updateFormData(
              "preferred_home_age_max",
              v && v.trim() !== "" ? parseInt(v, 10) || undefined : undefined
            )
          }
          placeholder="e.g. 30"
          keyboardType="number-pad"
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
        />
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">{FIELD_LABELS.MUST_HAVE}</Text>
        <Text className="mb-3 text-xs text-gray-500">
          Mark a few must-have features. We&apos;ll prioritize homes that match.
        </Text>
        <Box className="flex flex-row flex-wrap gap-2">
          {MUST_HAVE_OPTIONS.map((option) => {
            const selected = mustHave.includes(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => toggleMustHave(option.value)}
                className={`rounded-full border px-4 py-2 ${
                  selected ? "border-brand-accent bg-brand-accent/10" : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    selected ? "text-brand-accent" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.DAYS_ON_MARKET}
        </Text>
        <Box className="flex flex-row gap-3">
          <Box className="flex-1">
            <Text className="mb-1 text-xs font-medium text-gray-600">Min (days)</Text>
            <Input
              value={formData.days_on_market_min?.toString() ?? ""}
              onValueChange={(v) =>
                updateFormData(
                  "days_on_market_min",
                  v && v.trim() !== "" ? Number.parseInt(v, 10) || undefined : undefined
                )
              }
              placeholder="e.g. 7"
              keyboardType="number-pad"
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
            />
          </Box>
          <Box className="flex-1">
            <Text className="mb-1 text-xs font-medium text-gray-600">Max (days)</Text>
            <Input
              value={formData.days_on_market_max?.toString() ?? ""}
              onValueChange={(v) =>
                updateFormData(
                  "days_on_market_max",
                  v && v.trim() !== "" ? Number.parseInt(v, 10) || undefined : undefined
                )
              }
              placeholder="e.g. 90"
              keyboardType="number-pad"
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
            />
          </Box>
        </Box>
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.RENOVATION_PREFERENCE}
        </Text>
        <Box className="flex flex-row flex-wrap gap-2">
          {RENOVATION_OPTIONS.map((option) => {
            const selected = formData.renovation_preference === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  updateFormData(
                    "renovation_preference",
                    selected ? undefined : (option.value as unknown as string)
                  )
                }
                className={`rounded-full border px-4 py-2 ${
                  selected ? "border-brand-accent bg-brand-accent/10" : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    selected ? "text-brand-accent" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.INTENDED_PROPERTY_USE}
        </Text>
        <Box className="flex flex-row flex-wrap gap-2">
          {INTENDED_USE_OPTIONS.map((option) => {
            const selected = formData.intended_property_use === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  updateFormData(
                    "intended_property_use",
                    selected ? undefined : (option.value as unknown as string)
                  )
                }
                className={`rounded-full border px-4 py-2 ${
                  selected ? "border-brand-accent bg-brand-accent/10" : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    selected ? "text-brand-accent" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.WALKABILITY_IMPORTANCE}
        </Text>
        <Box className="flex flex-row flex-wrap gap-2">
          {WALKABILITY_OPTIONS.map((option) => {
            const selected = formData.walkability_importance === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  updateFormData(
                    "walkability_importance",
                    selected ? undefined : (option.value as unknown as string)
                  )
                }
                className={`rounded-full border px-4 py-2 ${
                  selected ? "border-brand-accent bg-brand-accent/10" : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    selected ? "text-brand-accent" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">
          {FIELD_LABELS.PREFERRED_HOME_FEATURES}
        </Text>
        <Text className="mb-3 text-xs text-gray-500">
          Separate features with commas (e.g., garage, pool, fireplace).
        </Text>
        <Input
          value={
            Array.isArray(formData.preferred_home_features)
              ? formData.preferred_home_features.join(", ")
              : ""
          }
          onValueChange={(v) => {
            const next =
              v && v.trim() !== ""
                ? v
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                : [];
            updateFormData("preferred_home_features", next.length > 0 ? next : undefined);
          }}
          placeholder="e.g., garage, pool, fireplace"
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
        />
      </Box>

      <Box>
        <Text className="mb-2 text-sm font-medium text-gray-700">{FIELD_LABELS.DEAL_BREAKERS}</Text>
        <Text className="mb-3 text-xs text-gray-500">
          Separate deal breakers with commas (e.g., No parking, Busy road).
        </Text>
        <Input
          value={Array.isArray(formData.deal_breakers) ? formData.deal_breakers.join(", ") : ""}
          onValueChange={(v) => {
            const next =
              v && v.trim() !== ""
                ? v
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                : [];
            updateFormData("deal_breakers", next.length > 0 ? next : undefined);
          }}
          placeholder="e.g., No parking, Busy road, Old plumbing"
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
        />
      </Box>
    </Box>
  );
}
