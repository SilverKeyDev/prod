import React from "react";

import Input from "@ui/form/Input";

import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

import {
  FIELD_LABELS,
  INTENDED_USE_OPTIONS,
  type OnboardingData,
  RENOVATION_OPTIONS,
  SECTION_TITLES,
  WALKABILITY_OPTIONS,
} from "@/features/profile/utils";

type Props = {
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

export function HousingStepDetails({ formData, updateFormData }: Props) {
  return (
    <Box className="gap-6">
      <Text className="text-text-primary text-lg font-semibold">
        {SECTION_TITLES.HOUSING_DETAILS}
      </Text>

      <Box>
        <Text className="text-text-secondary mb-2 text-sm font-medium">
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
                    selected ? undefined : (option.value as unknown as string),
                  )
                }
                className={`rounded-full border px-4 py-2 ${
                  selected
                    ? "border-primary bg-primary"
                    : "border-border bg-background-surface"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    selected ? "text-primary" : "text-text-secondary"
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
        <Text className="text-text-secondary mb-2 text-sm font-medium">
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
                    selected ? undefined : (option.value as unknown as string),
                  )
                }
                className={`rounded-full border px-4 py-2 ${
                  selected
                    ? "border-primary bg-primary"
                    : "border-border bg-background-surface"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    selected ? "text-primary" : "text-text-secondary"
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
        <Text className="text-text-secondary mb-2 text-sm font-medium">
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
                    selected ? undefined : (option.value as unknown as string),
                  )
                }
                className={`rounded-full border px-4 py-2 ${
                  selected
                    ? "border-primary bg-primary"
                    : "border-border bg-background-surface"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    selected ? "text-primary" : "text-text-secondary"
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
        <Text className="text-text-secondary mb-2 text-sm font-medium">
          {FIELD_LABELS.OTHER_REQUIREMENTS}
        </Text>
        <Text className="text-text-secondary mb-3 text-xs">
          Separate with commas (e.g., street parking, no gated communities).
        </Text>
        <Input
          value={
            Array.isArray(formData.other_requirements)
              ? formData.other_requirements.join(", ")
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
            updateFormData(
              "other_requirements",
              next.length > 0 ? next : undefined,
            );
          }}
          placeholder="e.g., street parking, no gated communities"
          className="border-border bg-background-surface text-text-primary rounded-lg border px-4 py-3 text-base"
        />
      </Box>
    </Box>
  );
}
